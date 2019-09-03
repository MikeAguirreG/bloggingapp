// Importing the db collection existing in db.js
const userCollection = require('../db').db().collection('users');

// For this we install the package validator with the next commmand
// npm install validator
const validator = require('validator');


// Setting the brcrypt to encrypt/hash passwords
// npm install bcryptjs
const bcrypt = require('bcryptjs');

//Using the md5 package to hash the email address
// npm install md5
const md5 = require('md5');


let User = function(data, getAvatar){
    //this.something =  data //the actual data
    this.data = data;
    this.errors = [];

    if(getAvatar == undefined){ getAvatar = false }
    if(getAvatar == true){ this.getAvatar() }// calling avatar
    
    // Simple way to add a method for user will be as follows, but it will create duplication.
    // Instead we use 'User.prototype' to give access to the object created to this method. 
    // this.jump = function(){
    //     console.log("User jumping");
    // }
}

//Clean up the input.
User.prototype.cleanUp = function(){
    if(typeof(this.data.username) != 'string'){
        this.data.username = '';
    }
    if(typeof(this.data.email) != 'string'){
        this.data.email = '';
    }
    if(typeof(this.data.password) != 'string'){
        this.data.password = '';
    }

    // get rid of any bogus (fraudulent) properties
    this.data = {
        username : this.data.username.trim().toLowerCase(),
        email    : this.data.email.trim().toLowerCase(),
        password : this.data.password
    }
}

// Validation
User.prototype.validate = function(){
    return new Promise(
        async (resolve, reject) => {
            //console.log(this.data.username);
        
            if(this.data.username == ""){
                this.errors.push("You must provide a username.");
            }
            if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)){
                this.errors.push("User name can only contain letters and numbers.");
            }
            if(this.data.username.length > 0 &&  this.data.username.length < 3){
                this.errors.push("Username must be at least 3 characters.")
            }
            if(this.data.username.length > 30){
                this.errors.push("Username cannot exced 100 characters.")
            }
            if(!validator.isEmail(this.data.email)){
                this.errors.push("You must provide a email.")
            }
            if(this.data.password == ""){
                this.errors.push("You must provide a password.")
            }
            if(this.data.password.length > 0 &&  this.data.password.length < 12){
                this.errors.push("Password must be at least 12 characters.")
            }
            if(this.data.password.length > 50){
                this.errors.push("Password cannot exced 50 characters.")
            }
            // Only if user name is valid, check if it's already taken
            if(this.data.username.length >2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)){
                let userNameExists = await userCollection.findOne({username : this.data.username});
                if(userNameExists){
                    this.errors.push(`'${this.data.username}' is already taken as username.`);
                }
            }
        
             // Only if email is valid, check if it's already taken
             if(validator.isEmail(this.data.email)){
                let emailExists = await userCollection.findOne({email : this.data.email});
                if(emailExists){
                    this.errors.push(`'${this.data.email}' is already being used.`);
                }
            }

            resolve() 
        
         
        }
    )
}

/// PROMISE STYLE

User.prototype.login = function(){
    
    return new Promise((resolve, reject) =>{
        //Step 1. Validate User data
        this.cleanUp();
        //read, load or lool up data from database.
        // converted the anonymous function to arrow in order to point to the password
        // using the this.data.password
        userCollection.findOne({username: this.data.username})
                      .then( (attemptedUser) => {
                        
                        // attemptedUser brings the user from db if there is one.
                        // this.data.password as is arrow function brings what we type
                        //if(attemptedUser && attemptedUser.password == this.data.password){  //Old without comparing the hashing
                        
                        //using bcrypt
                        if(attemptedUser && bcrypt.compareSync(this.data.password,attemptedUser.password)){
                            
                            //calling the avatar
                            // populating the this with the email as it is not set when the user logs in
                            this.data = attemptedUser;
                            this.getAvatar()
                            //console.log(`Congrats!!`);
                            resolve("Congrats!!");
                        }else{
                            //console.log("Invalid User/Password.");
                            reject("Invalid User/Password.");
                        }

                      })
                      .catch( () => {
                          // some error. DB failed for some reason.
                          reject("Please try again later.");

                      });


    });
}



/*  
Traditional call back function way

User.prototype.login = function(callback){
    //Step 1. Validate User data
    this.cleanUp();
    //read, load or lool up data from database.
    // converted the anonymous function to arrow in order to point to the password
    // using the this.data.password
    userCollection.findOne({username: this.data.username}, (err, attemptedUser) => {
        
        // attemptedUser brings the user from db if there is one.
        // this.data.password as is arrow function brings what we type
        if(attemptedUser && attemptedUser.password == this.data.password){
            //console.log(`Congrats!!`);
            callback("Congrats!!");
        }else{
            //console.log("Invalid User/Password.");
            callback("Invalid User/Password.");
        }

    });
}
*/




//Giving acces to this method to the Objects created.
User.prototype.register = function() {
    return new Promise(
        async (resolve, reject) => {
    
            //Step 1. Validate User data
            this.cleanUp();
            await this.validate();
            //Step 2. Only if there are not validation errors
            //        then save the user into a database.
            if(!this.errors.length){

                // Hashing user password
                let salt = bcrypt.genSaltSync(10);
                this.data.password = bcrypt.hashSync(this.data.password,salt);
                //inserting the new user.
                await userCollection.insertOne(this.data);
                //calling the avatar
                this.getAvatar()
                resolve();

            }else{
                reject(this.errors);
            }
        
            
        }
    )
}


/// Setting avatars
 User.prototype.getAvatar = function(){
     this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
 }

// Find by user name, no OO aproach
User.findByUserName = function(username){
    return new Promise( function (result, reject){
        if(typeof(username) != 'string'){
            reject();
            return;
        }
        userCollection.findOne({ username : username })
                      .then( function(userDoc){
                          if(userDoc){
                              userDoc = new User(userDoc, true) // gets avatar
                              //console.log(userDoc);
                              // Modifying what we pass no to expose extra data
                              userDoc = {
                                  _id : userDoc.data._id,
                                  username : userDoc.data.username,
                                  avatar : userDoc.avatar
                              }
                              result(userDoc);
                          }else{
                              reject();
                          }
                      })
                      .catch( function(){
                          reject();
                      })
    });
}

User.doesEmailExist = function(email){
    return new Promise(async function(resolve, reject){
        if(typeof(email) != "string"){
            resolve(false)
            return
        }

        let user = await userCollection.findOne({email : email})
        if(user){
            resolve(true)
        }else{
            resolve(false)
        }
    })
}


module.exports = User;