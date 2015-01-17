var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var config = require('../config');
var User = require('../models/user').User;
var log = require('./log')(module);

passport.serializeUser(function(user, done) {
  if(user.provider){
    done(null, user);
  } else {
    done(null, {type: 'local', id: user.id});
  }
});
passport.deserializeUser(function(obj, done) {
  if(obj.type=='local'){
    User.findById(obj.id, function(err, user) {
      done(err, user);
    });
  } else {
    done(null, obj);
  }
});
passport.use(new FacebookStrategy({
    clientID: config.get("facebook_api_key"),
    clientSecret: config.get("facebook_api_secret"),
    callbackURL: config.get("callback_url")
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        user = new User({username: username, password: password});
        user.save(function(err){
           if(err) return done(err);
           return done(null, user);
        });
      }
      if (!user.checkPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

module.exports.init = function(app){
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(function(req, res, next){
      res.locals.user = req.user;
      next();
  })
};

module.exports.routes = function(app){
  app.get('/auth/facebook', passport.authenticate('facebook'));
  app.get('/auth/facebook/callback',
    passport.authenticate('facebook'),
    function(req, res) {
      res.redirect('/');
    });
    
  app.post('/login', passport.authenticate('local'),
    function(req, res) {
      res.send({});
  });
  
  app.post('/logout',function(req, res, next){
    req.logout();
    res.redirect('/');
  });
  app.get('/logout',function(req, res, next){
    req.logout();
    res.redirect('/');
  });
};