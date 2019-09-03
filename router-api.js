const apiRouter =  require('express').Router()

// CORS, allowing to be fetch within another domain
// CROSS ORIGIN RESOURCE SHARING
// Web browser dont send asyncronous requests to other domains unless the other domain
// says explicitelly to do so.
// npm install cors
const cors = require('cors')
apiRouter.use(cors) // allowing from any domain CORS


// Including controllers.
const userController =  require('./controllers/userController');
const postController =  require('./controllers/postController');
const followController =  require('./controllers/followController');

apiRouter.post('/login', userController.apiLogin)
apiRouter.post('/create-post', userController.apiMustBeLoggedIn, postController.apiCreate)
apiRouter.delete('/post/:id', userController.apiMustBeLoggedIn, postController.apiDelete)

//no authenticated
apiRouter.get('/postsByAuthor/:username', userController.apiGetPostsByUsername) //http://localhost:3000/api/postsByAuthor/mike

module.exports = apiRouter

