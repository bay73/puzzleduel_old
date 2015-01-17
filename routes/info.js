var log = require('../scripts/log')(module);

exports.post = function(req, res, next){
   var displayName = req.body.displayName;
   var language = req.body.language;
   var email = req.body.email;
   if (req.user){
       var user = req.user;
       user.set('displayName', displayName);
       user.set('language', language);
       user.set('email', email);
       user.save(function(err){
          if(err) {
              return next(err);
          }
          res.sendStatus(200);
       });
   } else {
       next(500);
   }
   
}