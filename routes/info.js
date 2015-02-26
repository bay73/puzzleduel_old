var log = require('../scripts/log')(module);

exports.post = function(req, res, next){
   var displayName = req.body.displayName;
   var language = req.body.language;
   var email = req.body.email;
   var password = req.body.password;
   if (req.user){
       var user = req.user;
       user.set('displayName', displayName);
       user.set('language', language);
       user.set('email', email);
       if(password && password.length > 0){
           user.set('password', password);
       }
       user.save(function(err, user){
          if(err) {
              return next(err);
          }
          if(req.session && req.session.passport && req.session.passport.user)
              req.session.passport.user.displayName = user.displayName;
          res.sendStatus(200);
       });
   } else {
       next(500);
   }
};