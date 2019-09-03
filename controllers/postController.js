const Post = require('../models/Post');

// Screen for posts
exports.viewCreateScreen = function(req, res){
    res.render('create-post');
}

exports.create = function(req, res){
    let post = new Post(req.body , req.session.user._id) // req.body contains the form data, req.session the session things
    post.create()
        .then(function(newId){
            req.flash('success', 'New post succesfully created.')
            req.session.save( () => res.redirect(`/post/${newId}`));
        })
        .catch(function(error){
            errors.forEach((error) => req.flash('errors', error));
            req.session.save( () => res.redirect('/create-post')); 
        })

}

// finding a post by its ID. 
exports.viewSingle = async function(req, res){
    //res.render('single-post-screen');
    try{
        let post = await Post.findSingleById(req.params.id, req.visitorId);
        res.render('single-post-screen', {
            post : post,
            title : post.title
        })

    } catch{
        //res.send('404 template');
        res.render('404');
    }
}

// OROGINAL 
// exports.viewEditScreen = async function(req, res){
   
//     try{
//         let post = await Post.findSingleById(req.params.id);
//         if(post.authorId == req.visitorId){
//             res.render('edit-post', { post : post});
//         }else{
//             req.flash('errors', 'You do not have permission to perform that action');
//             req.session.save( () => res.redirect('/'))
//         }
//     }catch{
//         res.render('404');
//     }
// }

//  RECOMENDADA
exports.viewEditScreen = async function(req, res) {
    try {
      let post = await Post.findSingleById(req.params.id, req.visitorId)
      if (post.isVisitorOwner) {
        res.render("edit-post", {post: post})
      } else {
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(() => res.redirect("/"))
      }
    } catch {
      res.render("404")
    }
  }



exports.edit = function(req, res){
    let post = new Post(req.body, req.visitorId, req.params.id);
    post.update()
        .then( (status) => { 
            // the post was succesfully updated  in the database
            // userr was the owner, but there was validation errors.
            if(status == 'Success'){
                //post was updated in db
                req.flash('success', 'Post succesfully updated.');
                //save session
                req.session.save(function(){
                    res.redirect(`/post/${req.params.id}/edit`);
                })
            }else{
                //post has validation errors.
                post.errors.forEach(function(error){
                    req.flash('errors', error);
                })
                //save session
                req.session.save(function(){
                    res.redirect(`/post/${req.params.id}/edit`);
                })
            }
        })
        .catch( () => {
            // a post if the requested id does not exists
            // or if the current visitor is not the owner of the current post.
            req.flash('errors','You do not have permission to perform that action.');
            req.session.save(function(){
                res.redirect('/');
            });
        })
}

exports.delete =  function(req, res){
    Post.delete(req.params.id, req.visitorId)
        .then( () => {
            req.flash('success', "Post successfully deleted.");
            req.session.save( () => res.redirect(`/profile/${req.session.user.username}`));
        })
        .catch( () => {
            req.flash('errors', 'You do not have permission to perform that action.');
            req.session.save( () => res.redirect('/'));
        })

}


exports.search = function(req, res){
    Post.search(req.body.searchTerm)
        .then( posts  => {
            res.json(posts);
        })
        .catch( () => {
            res.json([]);
        })
}


// API Functions

exports.apiCreate = function(req, res){
    let post = new Post(req.body , req.apiUser._id) // req.body contains the form data, req.session the session things
    post.create()
        .then(function(newId){
            res.json("Congrats, new post created.") //we could include the newId
        })
        .catch(function(error){
            res.json(errors) 
        })

}

exports.apiDelete =  function(req, res){
    Post.delete(req.params.id, req.apiUser._id)
        .then( () => {
           res.json("Post succesfully deleted.")
        })
        .catch( () => {
            res.json("You do not have permission to perform that action.")
        })

}