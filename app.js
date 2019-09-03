
//Declaring main functionallity

const express = require('express');

// Includinf the session functionality
// npm install express-session
const session = require('express-session');

/// To store the session we install the package connect-mongo, we pass the session in MongoStore
/// npm install connect-mongo
const MongoStore = require('connect-mongo')(session)

// Using the package connect-flash for Flasing messages.
// npm install connect-flash
const flash = require('connect-flash');

//Markdown packer helper
// npm install marked
const markdown = require('marked');

// Cross Site Request Forgery
// npm install csurf
const csrf = require('csurf')

const app = express();

//Using the sanatizing HTML PACKAGE
//npm install sanitize-html
const sanitizeHTML = require('sanitize-html');


app.use(express.urlencoded({extended:false}));   //Accepts form submitting
app.use(express.json());                         //Accepts json's
app.use('/api', require('./router-api'))          //router for API


// Section options
let sessionOptions = session({
    secret: 'Javascript first aproach.',
    store: new MongoStore({client: require('./db')}), /// Default save the data in memory and it gets lost when we restart de server, so we overwrite it
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 , //a day
        httpOnly: true
    }
});

// Using it in the app.
app.use(sessionOptions);
// Using flash messages
app.use(flash());

// middleware function, runs before the router, we have access to user everywhere.
// avoiding duplication
app.use(function(req, res, next){

    // Make our markdown  function available from within ejs templates
    res.locals.filterUserHTML = function(content){
        return sanitizeHTML(markdown(content), {
            allowedTags : ['p','br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'em', 'h1' , 'h2' , 'h3', 'h4', 'h5', 'h6'],
            allowedAttributes : {}
        });
    }

    // Make error and success messages available for all templates
    res.locals.errors = req.flash('errors');
    res.locals.success = req.flash('success');

    // Make current user id available on the request object, putting it as visitor ID.
    if(req.session.user){
        req.visitorId = req.session.user._id;
    }else{
        req.visitorId = 0;
    }
    // Make user session data available within view templates
    res.locals.user = req.session.user;
    next();
});


// including requiring another js file
const router =  require('./router');

// Using the commun ways of submitting data on the web
//app.use(express.urlencoded({extended:false}));   //Accepts form submitting
//app.use(express.json());                         //Accepts json's


// Setting folders
app.use(express.static('public'));      // Setting accesibility to 'public' folder.
app.set('views','views');               // 1. arg express default views, 2. arg folder name
app.set('view engine', 'ejs')           // 1. arg 'Template Engine',     2. arg Template to be used.
                                        // Necessary to install ejs, command:
                                        // npm install ejs



app.use(csrf()) // with this the request will need a token.
app.use(function(req, res, next){
res.locals.csrfToken = req.csrfToken()
next()
})
                                        

app.use('/' , router);                  // 1. arg the place.  2. arg the router.

// Port to listen to.
// app.listen(3000);
// instead of declaring the port here we export the variable app
// and we get in db.js where the listening sentence will happen
// after the connection to the db.



// Managing the csrf errors
app.use(function(error, req, res, next){
    if(error){
        if(error.code == "EBADCSRFTOKEN"){
            req.flash('errors','Cross Site Request Forgery detected.')
            req.session.save(()=> res.redirect('/'))
        }else{
            res.render('404')
        }
    }
})

/// Adding socket.io
//  npm install socket.io
const server = require('http').createServer(app);

//without socket
//module.exports =  app;

//with socket
const io = require('socket.io')(server)

//express session package
// express session data available in the context of socket io
io.use(function(socket,next){
    sessionOptions(socket.request,socket.request.res,next)
})

io.on('connection', function(socket){

    // only if you're loggin you can see the message
    if(socket.request.session.user){

        let user = socket.request.session.user

        socket.emit('welcome', {
            username: user.username,
            avatar: user.avatar
        })

        //console.log("New user connected!")
        socket.on("chatMessageFromBrowser", function(data){
        // For everyone io.emit 
        socket.broadcast.emit("chatMessageFromServer", {
            message : sanitizeHTML(data.message, {allowedTags : [], allowedAttributes : []}),
            username : user.username,
            avatar : user.avatar
        });
    })
    }
})

module.exports = server