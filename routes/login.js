var User = require('../models/user').User;
var AuthError = require('../models/user').AuthError;

exports.post = function(req, res, next){
   var username = req.body.username;
   var password = req.body.password;
   
   User.authorize(username, password, function(err, user){
      if(err) {
         if(err instanceof AuthError){
            return next(403);
         } else {
            return next(err);
         }
      }
      req.session.user = user._id;
      res.send({});
   })
}