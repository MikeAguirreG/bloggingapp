const postCollection = require('../db').db().collection('posts');
const followsCollection = require('../db').db().collection('follows');
const ObjectID = require('mongodb').ObjectID; // tool to pass a simple string and returns a
                                              // special ObjectID.object type

//Reusing User model to get methods like getting the avatar
const User = require('./User');

//Using the sanatizing HTML PACKAGE
//npm install sanitize-html
const sanitizeHTML = require('sanitize-html');

// constructor function 
let Post = function(data, userid, requestedPostId){
    this.data =  data;
    this.errors = []; // initiating the array of errors
    this.userid = userid; // putting the user id in the object
    this.requestedPostId = requestedPostId; // putting the id of the id

}


Post.prototype.cleanUp = function(){
    if(typeof(this.data.title) != 'string'){
        this.data.title = ""
    }
    if(typeof(this.data.body) != 'string'){
        this.data.body = ""
    }

    // Get rid of any bogus  properties
    // if the user tries to send extra properties we ignore 'em
    this.data = {
        title : sanitizeHTML(this.data.title.trim() , {
            allowedTags : [],
            allowedAttributes : []
        }),
        body: sanitizeHTML(this.data.body.trim() , {
            allowedTags : [],
            allowedAttributes : []
        }),
        createdDate: new Date(),
        author: ObjectID(this.userid) //  method returns special ObjeectID
    }
}

Post.prototype.validate = function(){
    if(this.data.title == ""){
        this.errors.push("You must provide a title.");
    }
    if(this.data.body == ""){
        this.errors.push("You must provide post content.");
    }
}

Post.prototype.create = function(){
    return new Promise( (resolve, reject) =>{
        this.cleanUp();
        this.validate();
        if(!this.errors.length){
            // Save post into the database
            postCollection.insertOne(this.data)
                          .then( (info) => {
                             resolve(info.ops[0]._id); // returning the id of the just created item/post
                          })
                          .catch( () => {
                              this.errors.push('Please try again later.');
                              reject(this.errors);
                          })

        }else{
            //reject post
            reject(this.errors);
        }
    })

}

Post.prototype.update = function(){
    return new Promise( async (resolve, reject) => {
        try{
            let post = await Post.findSingleById(this.requestedPostId, this.userid);
            // if 
            if(post.isVisitorOwner){
                ///actually  update the  db 
                let status = await this.actuallyUpdate();
                console.log(status)
                resolve(status);

            }else{
                // they are not the owner of the post
                reject();
            }
        }catch{
            // 
            reject();
        }
    } );
}

Post.prototype.actuallyUpdate = function(){
    return new Promise( async (resolve, reject) => {
        this.cleanUp();
        this.validate();
        if(!this.errors.length){
            await postCollection.findOneAndUpdate({
                    _id: new ObjectID(this.requestedPostId)
                    }, 
                    {$set : {
                        title : this.data.title,
                        body : this.data.body
                        }
                    }
            );
            resolve('Success');

        } else{
            resolve('Failure');

        }
    })
}

// simple function
Post.findSingleById = function(id, visitorId){
    return new Promise( async function(resolve, reject){
        if(typeof(id) != 'string' || !ObjectID.isValid(id)){
            reject();
            return
        }
        //search for the post in the collection
        //let post =  await postCollection.findOne({_id: new ObjectID(id)}); // Finding just one
        
        // Agregate allows to perform multiple operation over the MongoDb db
        let posts  = await  Post.reusablePostQuery([
            {$match: {_id: new ObjectID(id)}}
        
        ], visitorId);

        if(posts.length){
            resolve(posts[0]);   // First item of that array
           console.log(posts[0])// Looking the selection
        }else{
            reject();
        }
    })
}


Post.reusablePostQuery = function(uniqueOperations, visitorId){
    return new Promise( async function(resolve, reject){

        let aggOperations = uniqueOperations.concat([
            { $lookup: {  
                from: 'users', 
                localField: 'author', 
                foreignField: '_id', 
                as: 'authorDocument'
            }},
            { $project:{
                title : 1, // 1 means true
                body : 1,
                createdDate : 1,
                authorId: "$author", //addinng the author id
                author : { $arrayElemAt : ['$authorDocument' , 0] } //Pulling array element in zero position
            }}               
        ]); // adding to and array what is inside the Concat

        // Agregate allows to perform multiple operation over the MongoDb db
        let posts  = await  postCollection.aggregate(aggOperations).toArray();

        // cleanUp author property in each post object
        posts = posts.map(function(post){
            post.isVisitorOwner = post.authorId.equals(visitorId) // true or false

            //cleaning the author ID from the objecto no to show it in the frontend
            post.authorId = undefined;
            post.author = {
                username : post.author.username,
                avatar : new User(post.author , true).avatar
            }
            return post;
        });
        
        resolve(posts);
           
    })
}

Post.findByAuthorId =  function(authorId){
    return Post.reusablePostQuery([
        { $match : {author : authorId}},
        { $sort: {createdDate : -1}} // 1 for ascencind order, -1 descending order
    ])
}


Post.delete = function(postIdToDelete, currentUserId){
    return new Promise( async (resolve, reject) => {
        try{
            let post = await Post.findSingleById(postIdToDelete , currentUserId);
            if(post.isVisitorOwner){
                await postCollection.deleteOne({_id : new ObjectID(postIdToDelete)});
                resolve();
            }else{
                reject();
            }
        }catch{
            reject();
        }
    })
}

Post.search =  function(searchTerm){
    return new Promise(async(resolve, reject) => {

        if(typeof(searchTerm) == "string"){
            let posts = await Post.reusablePostQuery([
                { $match: {$text: {$search: searchTerm}}},
                { $sort: {$score: {$meta: "textScore" }}}
            ]);
            resolve(posts);
        }else{
            reject();
        }

    })
}


Post.countPostsByAuthor = function(id){
    return new Promise(async (resolve,reject) => {
        let postCount = await postCollection.countDocuments({author: id});
        resolve(postCount);
    });

}


Post.getFeed = async function(userId) {

    //create an array  of the user ids that the current user follows
    let followedUsers = await followsCollection.find( { authorId : new ObjectID(userId) }).toArray()
    followedUsers = followedUsers.map((followdDoc) =>{
        return followdDoc.followedId;
    })

    // look for posts where the author is in the above array of followed users
    return Post.reusablePostQuery([
        {$match: {author : { $in: followedUsers}}},
        {$sort: {createdDate: -1}}
    ])

}

module.exports = Post; //Exporting the object post.