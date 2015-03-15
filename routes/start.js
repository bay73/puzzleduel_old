var User = require('../models/user').User;

exports.get = function(req, res, next){
  User
    .find({rating: {$gt: 1}})
    .sort({rating: -1})
    .limit(14)
    .select('_id displayName rating')
    .exec(function(err, data){
      if(err) return next(err);
      res.render('index', { languages: require('../translation').languages(), page: 'index', ratings: data });
    });
};
