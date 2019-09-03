// we use the package to use the .env file where the connectio string is.
// npm install dotenv
// gets the file called env. and see the connection string.
const dotenv = require('dotenv');
dotenv.config();


// Connection File
// npm install mongodb
const mongodb = require('mongodb');

//const connectionString = 'THE CONNECTION STRING';
// with procces.env.SOMETHING , it is possible to acces to environment variables.
mongodb.connect(process.env.CONNECTIONSTRING, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client){
    // Saving the db and exporting it.
    //module.exports = client.db() // Before adding to save sessions
    module.exports = client; // with sessions.
    // The practice is starting the connection before the app,
    // meaning before launching app.js, it is a must run the db.js
    // we changed in the package.json to run first the db.js file instead of app.js file.
    const app = require('./app');
    app.listen(process.env.PORT);
    
});