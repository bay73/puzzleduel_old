module.exports = function(app){
   app.get('/', require('./start').get);

   var User = require('../models/user').User;
   app.get('/users', function(req, res, next){
      User.find({},function(err, users){
         if(err) {
            next(err);
         }else{
            res.json(users);
         }
      })
   });
   
   app.post('/login', require('./login').post);
   app.post('/logout', require('./logout').post);
   app.get('/logout', require('./logout').post);
}
