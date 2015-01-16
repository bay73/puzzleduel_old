var log = require('../scripts/log')(module);

exports.post = function(req, res, next){
   var displayname = req.body.displayname;
   var language = req.body.language;
   var email = req.body.email;
   if (req.user){
       var user = req.user;
       user.set('displayname', displayname);
       user.set('language', language);
       user.set('email', email);
       log.debug(user.email);
       user.save(function(err){
          log.debug('saveres=' + err);
          if(err) {
              return next(err);
          }
          res.sendStatus(200);
       });
   } else {
       next(500);
   }
   
}