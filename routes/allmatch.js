var async = require('async');
var AllUser = require('../models/match').AllUser;
var Match = require('../models/match').Match;

exports.get = function(req, res, next){
   var userId = req.param('userId');
   async.waterfall([
      function(callback){
         if(req.user && (req.user.id=='54ba6faadf5e31b2314364be' || req.user.id=='942960155727747')){
            callback(null);
         } else {
            callback(404);
         }
      },
      function(callback){
        AllUser
        .find()
        .select('_id id type displayName')
        .exec(function(err, data){
            if(err) return callback(err);
            callback(null, data);
        });
      },
      function(users, callback){
          var user;
          var userMap = {};
          for(var i=0;i<users.length;i++){
              userMap[users[i]._id] = users[i];
              if(userId){
                  if(userId == users[i]._id){
                      user = users[i];
                  }
              }
          }
          callback(null, user, userMap);
      },
      function(user, users, callback){
          if(user) {
             Match
             .find({user: user})
             .sort({started: -1})
             .limit(1000)
             .select('user opponent started win reason pro contra ratingChange')
             .exec(function(err, data){
                if(err) return callback(err);
                callback(null, users, data);
             });
          } else {
             Match
             .find()
             .sort({started: -1})
             .limit(1000)
             .select('user opponent started win reason pro contra ratingChange')
             .exec(function(err, data){
                if(err) return callback(err);
                callback(null, users, data);
             });
             
          }
      },
      function(users, matches, callback){
          var data = [];
          for(var i=0;i<matches.length;i++){
             var show = (users[matches[i].user].type != 'bot');
             if(show && users[matches[i].opponent].type != 'bot'){
                show = (matches[i].user < matches[i].opponent);
             }
             if(userId || show) {
                 var score = matches[i].pro.toString().concat(' : ', matches[i].contra.toString());
                 if (matches[i].reason != 'finish'){
                     score = matches[i].reason;
                 }
                 var firstRating = Math.round(matches[i].ratingChange).toString();
                 if(Math.round(matches[i].ratingChange) > 0){
                     firstRating = '+' + firstRating;
                 }
                 var secondRating = -Math.round(matches[i].ratingChange).toString();
                 if(Math.round(matches[i].ratingChange) < 0){
                     secondRating = '+' + secondRating;
                 }
                 var d = matches[i].started;
                 var matchDate = d.getDate().toString().concat('/', (d.getMonth()+1), '/', d.getFullYear());
                 var firstWinClass = '';
                 var secondWinClass = '';
                 if(typeof(matches[i].win)==='undefined') {
                     firstWinClass = 'draw';
                     secondWinClass = 'draw';
                 } else {
                     if(matches[i].win) {
                        firstWinClass = 'win';
                        secondWinClass = 'loose';
                     } else {
                        firstWinClass = 'loose';
                        secondWinClass = 'win';
                     }
                 }
                 data.push({date: matchDate, score: score, 
                           firstUser: matches[i].user, secondUser: matches[i].opponent, 
                           firstName: users[matches[i].user].displayName, secondName: users[matches[i].opponent].displayName, 
                           firstType: users[matches[i].user].type, secondType: users[matches[i].opponent].type, 
                           firstRating: firstRating, secondRating: secondRating, 
                           firstWin: firstWinClass, secondWin: secondWinClass });
             }
          }
          callback(null, data);
      },
      function(matches, callback){
          res.render('allmatch', { languages: require('../translation').languages(), matches: matches });
      }
      ], next);
};
