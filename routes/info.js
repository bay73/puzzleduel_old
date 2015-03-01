var log = require('../scripts/log')(module);
var User = require('../models/user').User;

exports.post = function(req, res, next){
   var displayName = req.body.displayName;
   var language = req.body.language;
   var email = req.body.email;
   var password = req.body.password;
   var type = req.body.type;
   if(type == 'local'){
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
   } else {
      if (req.user){
         User.findOne({ username: req.user.id, provider: req.user.provider }, function (err, user) {
            if (err) { return next(err); }
            if (!user) {
               user = new User({username: req.user.id, displayName: req.user.displayName, provider: req.user.provider});
               user.set('language', language);
               user.set('email', email);
               user.save(function(err, user){
                  if(err) return next(err);
                  req.user.email = email;
                  req.user.language = language;
                  res.sendStatus(200);
               });
            } else {
               user.set('language', language);
               user.set('email', email);
               user.save(function(err, user){
                  if(err) return next(err);
                  req.user.email = email;
                  req.user.language = language;
                  res.sendStatus(200);
               });
            }
         });
      } else {
         next(500);
      }
   }
};