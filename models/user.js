var crypto = require('crypto');
var async = require('async');
var util = require('util');
var validator = require("email-validator");
var langs = require('../translation').languages();

var mongoose = require('../scripts/mongoose'),
    Schema = mongoose.Schema;

var shorten = function(text){
   return text.trim().substring(0,25);
}

var schema = new Schema({
   username: {
      type: String,
      unique: true,
      required: true,
      set: shorten
   },
   salt: {
      type: String,
      required: true
   },
   hashedPassword: {
      type: String,
      required: true
   },
   created: {
      type: Date,
      defaule: Date.now
   },
   displayname: {
      type: String
   },
   language: {
      type: String,
      default: 'en'
   },
   email: {
      type: String
   }
});

schema.methods.encryptPassword = function(password){
   password = password.trim().toLowerCase();
   return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
}

schema.methods.checkPassword = function(password){
   return this.encryptPassword(password) === this.hashedPassword;
}

schema.virtual('password')
   .set(function(password){
      password = password.trim().toLowerCase();
      this._plainPassword = password;
      this.salt = Math.random() + '';
      this.hashedPassword = this.encryptPassword(password);
   })
   .get(function(){
      return this._plainPassword;
   })

schema.statics.authorize = function(username, password, callback){
   username = shorten(username);
   if(username.length === 0 || password.trim().length === 0) {
      callback(new AuthError());
   }
   var User = this;
   async.waterfall([
      function(callback){
         User.findOne({username: username}, callback);
      },
      function(user, callback){
         if(user) {
            if(user.checkPassword(password)){
               callback(null, user)
            }else{
               callback(new AuthError());
            }
         } else {
            user = new User({username: username, password: password});
            user.save(function(err){
               if(err) return callback(err);
               callback(null, user);
            });
         }
      }
      
   ], callback);
}


schema.pre('save', function (next) {
  if(!this.displayname) {
     this.displayname = this.username;
  }
  this.displayname = shorten(this.displayname);
  var err;
  if(this.email && !validator.validate(this.email)){
     err = new Error('Wrong email!');
  }
   var good=false;
   for(var i=0;i<langs.length;i++){
       if(langs[i].lang == this.language){
           good = true;
       }
   }
   if(!good){
     err = new Error('Wrong language code!');
   }
   console.log(err);
   next(err)
});

exports.User = mongoose.model('User', schema);

util.inherits(AuthError, Error);
function AuthError(message) {
   Error.apply(this, arguments);
   Error.captureStackTrace(this, AuthError);
   
   this.message = message || 'AuthError';
}
AuthError.prototype.name = 'AuthError';

exports.AuthError = AuthError;