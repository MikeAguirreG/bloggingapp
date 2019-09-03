//require DB
const usersCollection = require('../db').db().collection('users');
const followsCollection = require('../db').db().collection('follows');
//Setting up ObjectID
const ObjectID = require('mongodb').ObjectID;
const User = require('./User');//import the model

let Follow = function(followedUsername, authorId){
    this.followedUsername = followedUsername;
    this.authorId = authorId;
    this.errors = [];
}


Follow.prototype.cleanUp = async function () {
    if(typeof(this.followedUsername) != "string"){
        this.followedUsername = "";
    }
}

Follow.prototype.validate = async function (action) {
    //followedUsername must exists in database
    let followedAccount = await usersCollection.findOne({username : this.followedUsername})
    if(followedAccount){
        this.followedId =  followedAccount._id
    }else{
        this.errors.push("You cannot follow a user that does not exists.")
    }
    let doesFollowAlreadyExists = await followsCollection.findOne({
        followedId : this.followedId,
        authorId : new ObjectID(this.authorId)
    });

    // Seeing if they want to duplicate a follow action
    if(action == "create"){
        if(doesFollowAlreadyExists){
            this.errors.push(`You are already following ${this.followedUsername}`);
        }
    }

    // Seeing if they want to duplicate a unfollow action
    if(action == "delete"){
        if(!doesFollowAlreadyExists){
            this.errors.push(`You cannot stop folowing ${this.followedUsername}, as you do not follow it.`);
        }
    }
    ///Should not be able to follow yourself
    if(this.followedId.equals(this.authorId)){
        this.errors.push("You cannot follow yourself!")
    }
}

Follow.prototype.create = function(){
    return new Promise( async(resolve, reject) => {
        this.cleanUp();
        await this.validate("create");
        if(!this.errors.length){
            //storing in DB
            await followsCollection.insertOne({
                  followedId : this.followedId,
                  authorId :  new ObjectID(this.authorId)
            });
            resolve();
        }else{
            reject(this.errors) 
        }
    })
}


Follow.prototype.delete = function(){
    return new Promise( async(resolve, reject) => {
        this.cleanUp();
        await this.validate("delete");
        if(!this.errors.length){
            //storing in DB
            await followsCollection.deleteOne({
                  followedId : this.followedId,
                  authorId :  new ObjectID(this.authorId)
            });
            resolve();
        }else{
            reject(this.errors) 
        }
    })
}

Follow.isVisitorFollowing = async function(followedId, visitorId){
    // see if the matchng visitor id follows already the current account I am logged in
    let followDoc = await followsCollection.findOne({
        followedId : followedId,
        authorId : new ObjectID(visitorId)
    });
    if(followDoc){
        return true;
    }else{
        return false;
    }
}

Follow.getFollowersById = function(id){
    return new Promise( async (resolve, reject) => {
        try {
            let followers = await followsCollection.aggregate([
                {$match : { followedId : id}},
                {$lookup: {
                    from: "users" , 
                    localField: "authorId" , 
                    foreignField: "_id", 
                    as: "userDoc"}},
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username" , 0]},
                    email: {$arrayElemAt: ["$userDoc.email" , 0]}
                }}
            ]).toArray();
            followers = followers.map(function (follower) {
                /// Create a user
                let user = new  User (follower, true);
                return {username : follower.username,avatar : user.avatar};

            })
            resolve(followers);

        }catch{
            reject();
        }
    })
}

Follow.getFollowingById = function(id){
    return new Promise( async (resolve, reject) => {
        try {
            let followers = await followsCollection.aggregate([
                {$match : { authorId : id}},
                {$lookup: {
                    from: "users" , 
                    localField: "followedId" , 
                    foreignField: "_id", 
                    as: "userDoc"}},
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username" , 0]},
                    email: {$arrayElemAt: ["$userDoc.email" , 0]}
                }}
            ]).toArray();
            followers = followers.map(function (follower) {
                /// Create a user
                let user = new  User (follower, true);
                return {username : follower.username,avatar : user.avatar};

            })
            resolve(followers);

        }catch{
            reject();
        }
    })
}


Follow.countFollowersById = function(id){
    return new Promise(async (resolve,reject) => {
        let followerCount = await followsCollection.countDocuments({followedId: id});
        resolve(followerCount)
    });

}


Follow.countFollowingById = function(id){
    return new Promise(async (resolve,reject) => {
        let followingCount = await followsCollection.countDocuments({authorId: id});
        resolve(followingCount)
    });

}


module.exports = Follow;