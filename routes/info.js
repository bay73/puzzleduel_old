exports.post = function(req, res, next){
  var displayName = req.body.displayName;
  var language = req.body.language;
  var email = req.body.email;
  var password = req.body.password;
  if (!req.user){
    next(500);
  }
  var user = req.user;
  if(user.provider == 'local'){
    if(password && password.length > 0){
      user.set('password', password);
    }
  }
  if(displayName && displayName.length > 0) {
    user.set('displayName', displayName);
  }
  if(language && language.length > 0){
    user.set('language', language);
  }
  if(email != undefined){
    user.set('email', email);
  }
  user.save(function(err, user){
    if(err) {
      return next(err);
    }
    if(req.session && req.session.passport && req.session.passport.user) {
      req.session.passport.user.displayName = user.displayName;
    }
    res.sendStatus(200);
  });
};