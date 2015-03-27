var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var config = require('../config');
var User = require('../models/user').User;
var log = require('./log')(module);
var convertLocaleToLang = require('../translation').convertLocaleToLang;

passport.serializeUser(function(user, done) {
  done(null, user._id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err,user){
    err
      ? done(err)
      : done(null,user);
  });
});

passport.use(new LocalStrategy(
  {passReqToCallback: true},
  function(req, username, password, done) {
    var userData = {provider: 'local', 
                    username: username, 
                    displayName: username, 
                    password: password, 
                    addNew: req.body.createnew=="true"};
    User.authorize(userData, function(err, user){
      err
        ? done(null, false, { user: user!==null && user!==undefined, message: err.message })
        : done(null, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: config.get("facebook_login:api_key"),
    clientSecret: config.get("facebook_login:api_secret"),
    callbackURL: config.get("facebook_login:callback_url")
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      var userData = {provider: profile.provider,
                      username: profile.id,
                      displayName: profile.displayName,
                      language: convertLocaleToLang(profile._json.locale),
                      addNew: true};
      User.authorize(userData, function(err, user){
        err
          ? done(null, false, { user: user!==null && user!==undefined, message: err.message })
          : done(null, user);
      });
    });
  }
));

passport.use(new GoogleStrategy({
    clientID: config.get("google_login:client_id"),
    clientSecret: config.get("google_login:client_secret"),
    callbackURL: config.get("google_login:callback_url")
  },
  function(accessToken, refreshToken, profile, done) {
    var userData = {provider: profile.provider,
                    username: profile.id,
                    displayName: profile.displayName,
                    language: convertLocaleToLang(profile._json.locale),
                    addNew: true};
    User.authorize(userData, function(err, user){
      err
        ? done(null, false, { user: user!==null && user!==undefined, message: err.message })
        : done(null, user);
    });
  }
));

module.exports.init = function(app){
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(function(req, res, next){
      res.locals.user = req.user;
      next();
  });
};

module.exports.routes = function(app){
  app.get('/auth/facebook', passport.authenticate('facebook'));
  app.get('/facebookcallback',
    passport.authenticate('facebook'),
    function(req, res) {
      var redirect_to = req.session.redirect_to ? req.session.redirect_to : '/';
      delete req.session.redirect_to;
      res.redirect(redirect_to);
    });
    
  app.post('/login',function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) {
        return info.user
          ? next(401)
          : next(403);
      }
      req.logIn(user, function(err) {
        err
          ? next(err)
          : res.send({});
      });
    })(req, res, next);
  });

  app.get('/auth/google', passport.authenticate('google',
    { scope: ['https://www.googleapis.com/auth/userinfo.profile',
              'https://www.googleapis.com/auth/userinfo.email'] })
  );
  app.get('/oauth2callback',
    passport.authenticate('google'),
    function(req, res) {
      var redirect_to = req.session.redirect_to ? req.session.redirect_to : '/';
      delete req.session.redirect_to;
      res.redirect(redirect_to);
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