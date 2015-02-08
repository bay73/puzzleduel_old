var async = require('async');
var AllUser = require('../models/match').AllUser;
var Match = require('../models/match').Match;

exports.get = function(req, res, next){
   async.waterfall([
      function(callback){
        AllUser
        .find()
        .select('id displayName')
        .exec(function(err, data){
            if(err) return callback(err);
            callback(null, data);
        });
      },
      function(users, callback){
          var user;
          var userMap = {};
          for(var i=0;i<users.length;i++){
              userMap[users[i]._id] = users[i].displayName;
              if(req.user){
                  if(req.user.type == users[i].type && req.user.id == users[i].id){
                      user = users[i];
                  }
              }
          }
          if(user){
              callback(null, user, userMap);
          }else{
              callback(403);
          }
      },
      function(user, users, callback){
          Match
          .find({user: user})
          .sort({started: -1})
          .limit(50)
          .select('opponent started win reason pro contra ratingChange')
          .exec(function(err, data){
             if(err) return callback(err);
             callback(null, users, data);
          });
      },
      function(users, matches, callback){
          var data = [];
          for(var i=0;i<matches.length;i++){
              var score = matches[i].pro.toString().concat(' : ', matches[i].contra.toString());
              if (matches[i].reason != 'finish'){
                  score = matches[i].reason;
              }
              var rating = Math.round(matches[i].ratingChange).toString();
              if(Math.round(matches[i].ratingChange) > 0){
                  rating = '+' + rating;
              }
              var d = matches[i].started;
              if(d){
                  var matchDate = d.getDate().toString().concat('/', (d.getMonth()+1), '/', d.getFullYear());
              } else {
                  matchDate = '../../....'
              }
              var winClass = '';
              if(typeof(matches[i].win)==='undefined') {
                  winClass = 'draw';
              } else {
                  if(matches[i].win) winClass = 'win'
                  else winClass = 'loose'
              }
              data.push({date: matchDate, displayName: users[matches[i].opponent], score: score, rating: rating, win:winClass });
          }
          callback(null, data);
      },
      function(matches, callback){
          res.render('matchhistory', { languages: require('../translation').languages(), matches: matches });
      }
      ], next);
};
