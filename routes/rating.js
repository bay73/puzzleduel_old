var User = require('../models/user').User;

exports.get = function(req, res, next){
  User
    .find({rating: {$gt: 1}})
    .sort({rating: -1})
    .select('_id displayName rating')
    .exec(function(err, data){
      if(err) return next(err);
      res.render('rating', { languages: require('../translation').languages(), page: 'rating', ratings: data, invitationCount: 0 });
    });
};
