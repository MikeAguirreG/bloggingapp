//Router works listing our all url or routes the app is looking for.

const express =  require('express');
const router = express.Router();

// Including controllers.
const userController =  require('./controllers/userController');
const postController =  require('./controllers/postController');
const followController =  require('./controllers/followController');


// pointing to the actual controller.

// User related routes

router.get('/', userController.home);
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.post('/doesUsernameExist', userController.doesUsernameExist);
router.post('/doesEmailExist', userController.doesEmailExist);

// Profile related routes
router.get('/profile/:username', userController.idUserExists , userController.sharedProfileData, userController.profilePostsScreen);
router.get('/profile/:username/followers', userController.idUserExists , userController.sharedProfileData, userController.profileFollowersScreen);
router.get('/profile/:username/following', userController.idUserExists , userController.sharedProfileData, userController.profileFollowingScreen);

// Posting related routes

router.get('/create-post', userController.mustBeLoggedIn , postController.viewCreateScreen);
router.post('/create-post', userController.mustBeLoggedIn, postController.create);

 // :id stands for flexible 
 // no calling must be loggin because public can see the post.
router.get('/post/:id', postController.viewSingle);
router.get('/post/:id/edit', userController.mustBeLoggedIn , postController.viewEditScreen);
router.post('/post/:id/edit', userController.mustBeLoggedIn , postController.edit);
router.post('/post/:id/delete', userController.mustBeLoggedIn , postController.delete);

// From frontend, 'axios'
router.post('/search', postController.search);


// Follow related routes
router.post('/addFollow/:username', userController.mustBeLoggedIn ,followController.addFollow);
router.post('/removeFollow/:username', userController.mustBeLoggedIn ,followController.removeFollow);

// exporting the router.
module.exports = router;  