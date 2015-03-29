var User = require('../models/user').User;
var Invitation = require('../models/invitation').Invitation;
var async = require('async');

exports.get = function(req, res, next){
  async.waterfall([
    function(callback){
      User
        .find({rating: {$gt: 1}})
        .sort({rating: -1})
        .limit(14)
        .select('_id displayName rating')
        .exec(callback);
    },
    function(ratings, callback){
      if(!req.user || !req.user._id){
        return callback(null, ratings, false);
      }
      var user = req.user._id;
      var now = new Date();
      Invitation
      .count(
        {$or: [
          {$and: [
            {opponent: user}, 
            {endTime : {$gt: now}}, 
            {status: 'new'}
          ]},
          {$and : [
            {$or: [
              {user: user}, 
              {opponent: user}
            ]},
            {endTime : {$gt: now}},
            {startTime : {$lt: now}},
          ]}
        ]})
      .exec(function(err, count){
        if(err) return callback(err);
        callback(null, ratings, count);
      });
    },
    function(ratings, invitationCount, callback){
      res.render('index', { languages: require('../translation').languages(), page: 'index', ratings: ratings, invitationCount:  invitationCount});
    }],next);
};
