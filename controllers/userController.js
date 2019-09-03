// Importing models
const User = require('../models/User'); 
const Post = require('../models/Post');
const Follow = require('../models/Follow');


// JSONwebtokens package
// npm install jsonwebtoken
const jwt = require('jsonwebtoken');


// Controller requests

// To check that is logged in Everywhere,
// this function will be used for mostly all acontrollers
exports.mustBeLoggedIn = function(req , res, next){
    if(req.session.user){
        next();
    }else{
        req.flash('errors',"You must be logged in to perform this action.");
        req.session.save(function(){
            res.redirect('/');
        })
    }

}


/// PROMISE
exports.login = function(req,res){
    let user = new User(req.body);
  
    //with promise
    user.login()
        .then(function(result){  //everything good
            //using the session user, the session object is unique for each user
            req.session.user = {
                avatar: user.avatar, // the avatar
                username: user.data.username,
                _id : user.data._id // adding the unique id to the session
            };
            //manually saving the session
            req.session.save(function(){ 
                res.redirect('/');
            })
                                
            //res.send(result);
        })
        .catch(function(error){  // all wrong
            //res.send(error); // just sending error.
            // using flash
            // it does this: req.sesssion.flash.errros = [errror]
            req.flash('errors', error); //'errors' can be anything
            //manually saving the session and putting the flash message
            req.session.save(function(){
                 res.redirect('/');
             })
        })

}

exports.logout = function(req, res){

    /// Destroying the session.
    req.session.destroy(function(){
        res.redirect('/');
    }); 
    //res.render("");
    
}


/*
USING CALLBACK

exports.login = function(req,res){
    let user = new User(req.body);

    //traditional approach with callback function
    user.login(function(resultFromCallback){
        res.send(resultFromCallback);
    });

}

exports.logout = function(){
    
}
*/





exports.register = function(req,res){
    //console.log(req.body);  // Everything in our request.
    let user = new User(req.body); //passing what the user typed in the inputs
    user.register()
        .then( () => {
            req.session.user = { 
                username : user.data.username,
                avatar : user.avatar, // the avatar
                _id : user.data._id    // adding the unique user id to the session
            }
            req.session.save(function(){
                res.redirect('/')
            })

        })
        .catch( (regErrors) => {
             //res.send(user.errors); //Sending normal errors.
            /// using flash to show errors
            console.log('Regg errors'+ regErrors )
            regErrors.forEach(function(error){
                req.flash('registrationErrors', error);
            });
            req.session.save(function(){
                res.redirect('/')
            })
        })

    //console.log(user.homePlanet); // some function

   
}

exports.home = async function(req, res){
    if(req.session.user){
        // fetch feed of post for current user
        let posts = await Post.getFeed(req.session.user._id);
        res.render('home-dashboard', { posts : posts} );
    }else{
        // With flash, as soon as you acces to the errors, it deletes them, so are going 
        // to appear just once. 
        res.render('home-guest', { 
            registrationErrors : req.flash('registrationErrors')
        });

    }
    
}

exports.idUserExists = function(req, res, next){
    //next();
    User.findByUserName(req.params.username)
        .then( function(userDocument){
            req.profileUser = userDocument;
            next();
        })
        .catch( function(){
            res.render('404')
        })
}

exports.profilePostsScreen =  function(req , res){
    //Ask the Post model for posts by certain author id
    // we neeed to include the Post model.
    Post.findByAuthorId(req.profileUser._id)
        .then(function(posts){
            res.render('profile', {
                title : `${req.profileUser.username}'s profile`,
                currentPage : "posts",
                posts : posts, //this comes from the Post model
                profileUsername : req.profileUser.username,
                profileAvatar : req.profileUser.avatar,
                isFollowing : req.isFollowing,
                isVisitorsProfile : req.isVisitorsProfile,
                counts : {
                    postCount : req.postCount,
                    followerCount : req.followerCount,
                    followingCount : req.followingCount
                }
            });


        })
        .catch(function(){
            res.render('404');
        })


}


exports.sharedProfileData = async function(req,res,next){
    let isVisitorsProfile = false; // see if visitor is the same than the author
    let isFollowing = false;
    if(req.session.user){
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId);
        isVisitorsProfile = req.profileUser._id.equals(req.session.user._id) //true /false
    }
    req.isFollowing = isFollowing;
    req.isVisitorsProfile =  isVisitorsProfile;

    /// Retrieve post, follower, and following counts
    let postCountPromise =  Post.countPostsByAuthor(req.profileUser._id);
    let followerCountPromise =  Follow.countFollowersById(req.profileUser._id);
    let followingCountPromise =  Follow.countFollowingById(req.profileUser._id);
    //array destructuring
    let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise]);
    req.postCount = postCount;
    req.followerCount = followerCount;
    req.followingCount = followingCount;
    next();

}

exports.profileFollowersScreen = async function(req,res){
    try{
        let followers = await Follow.getFollowersById(req.profileUser._id);
        res.render('profile-followers', {
            title : `${req.profileUser.username}'s followers`,
            currentPage : "followers",
            followers: followers,
            profileUsername : req.profileUser.username,
            profileAvatar : req.profileUser.avatar,
            isFollowing : req.isFollowing,
            isVisitorsProfile : req.isVisitorsProfile,
            counts : {
                postCount : req.postCount,
                followerCount : req.followerCount,
                followingCount : req.followingCount
            }
         });

    }catch{
        res.render("404");
    }

}


exports.profileFollowingScreen = async function(req,res){
    try{
        let following = await Follow.getFollowingById(req.profileUser._id);
        res.render('profile-following', {
            title : `${req.profileUser.username}'s followings`,
            currentPage : "following",
            following: following,
            profileUsername : req.profileUser.username,
            profileAvatar : req.profileUser.avatar,
            isFollowing : req.isFollowing,
            isVisitorsProfile : req.isVisitorsProfile,
            counts : {
                postCount : req.postCount,
                followerCount : req.followerCount,
                followingCount : req.followingCount
            }
         });

    }catch{
        res.render("404");
    }

}

exports.doesUsernameExist = function(req, res){
    User.findByUserName(req.body.username)
        .then(function() {
            res.json(true)
        })
        .catch(function(){
            res.json(false)
        })
}


exports.doesEmailExist = async function(req, res){
    let emailBoolean = await User.doesEmailExist(req.body.email)
    res.json(emailBoolean)    
}




// Api functions
exports.apiLogin = function(req,res){
    let user = new User(req.body);
  
    //with promise
    user.login()
        .then(function(result){  
            //res.json(`Welcome to the Post App ${req.body.username}`);
            res.json(jwt.sign({
              _id : user.data._id  
            },
            process.env.JWTSECRET,
            {
                expiresIn: '7d'
            }));
        })
        .catch(function(error){  
            res.json("Sorry, username or password are not correct.")
        })

}


exports.apiMustBeLoggedIn = function(req , res, next){
    try{
        req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET) 
        //apiUser can be any word
        next()
    }catch{
        res.json("You must provide a valid token.")
    }

}

exports.apiGetPostsByUsername = async function(req,res){
    try{
        let authorDoc = await User.findByUserName(req.params.username)
        let posts = await Post.findByAuthorId(authorDoc._id)
        res.json(posts)
    }catch{
        res.json("Sorry, invalid user requested.")
    }
}