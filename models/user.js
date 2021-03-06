var crypto = require('crypto');
var async = require('async');
var util = require('util');
var validator = require("email-validator");
var langs = require('../translation').languages();

var mongoose = require('../scripts/mongoose');
var Schema = mongoose.Schema;

var shorten = function(text){
  return text.trim().substring(0,25);
};

var schema = new Schema({
  provider: {
    type: String,
    default: 'local'
  },
  username: {
    type: String,
    required: true,
    set: shorten
  },
  salt: {
    type: String
  },
  hashedPassword: {
    type: String
  },
  created: {
    type: Date,
    default: Date.now
  },
  displayName: {
    type: String
  },
  language: {
    type: String,
    default: 'en'
  },
  email: {
    type: String,
    default: ''
  },
  rating: {
    type: Number
  }
});

schema.index({ username: 1, provider: 1 }, { unique: true });
schema.index({ displayName: 1}, { unique: false });

schema.methods.encryptPassword = function(password){
  password = password.trim().toLowerCase();
  return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

schema.methods.checkPassword = function(password){
  return this.encryptPassword(password) === this.hashedPassword;
};

schema.virtual('password')
  .set(function(password){
    password = password.trim().toLowerCase();
    this._plainPassword = password;
    this.salt = Math.random() + '';
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function(){
    return this._plainPassword;
  });

schema.statics.authorize = function(userData, callback){
  var username = shorten(userData.username);
  if(username.length === 0 || userData.provider.length === 0 || 
    (userData.provider == 'local' && userData.password.trim().length === 0)) {
    callback(new AuthError());
  }
  var User = this;
  async.waterfall([
    function(callback){
      User.findOne({provider: userData.provider, username: username}, callback);
    },
    function(user, callback){
      if(user) {
        if(user.provider != 'local' || user.checkPassword(userData.password)){
          callback(null, user);
        }else{
          callback(new AuthError('Wrong password'), user);
        }
      } else if (userData.addNew){
        user = new User(userData);
        user.save(function(err, user){
          if(err) {
            return callback(err, null);
          }
          callback(null, user);
        });
      } else {
        callback(new AuthError('User not found'), null);
      }
    }
  ], callback);
};

schema.pre('save', function (next) {
  if(!this.displayName) {
    this.displayName = this.username;
  }
  this.displayName = shorten(this.displayName);
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
  next(err);
});


util.inherits(AuthError, Error);
function AuthError(message) {
  Error.apply(this, arguments);
  Error.captureStackTrace(this, AuthError);
   
  this.message = message || 'AuthError';
}
AuthError.prototype.name = 'AuthError';

exports.User = mongoose.model('User', schema);
exports.AuthError = AuthError;