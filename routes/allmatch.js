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
             .select('user opponent started fixed win reason pro contra ratingChange')
             .exec(function(err, data){
                if(err) return callback(err);
                callback(null, users, data);
             });
          } else {
             Match
             .find()
             .sort({started: -1})
             .limit(1000)
             .select('user opponent started fixed win reason pro contra ratingChange')
             .exec(function(err, data){
                if(err) return callback(err);
                callback(null, users, data);
             });
             
          }
      },
      function(users, matches, callback){
          var data = [];
          for(var i=0;i<matches.length;i++){
             var user1 = users[matches[i].user];
             var user2 = users[matches[i].opponent];
             var type1 = user1?user1.type:'undefined';
             var type2 = user2?user2.type:'undefined';
             var show = ((type1 != 'bot' && type2 == 'bot')
                  || (type1 != 'bot' && type2 != 'bot' && matches[i].user < matches[i].opponent)
                  || (type1 == 'bot' && type2 == 'bot' && matches[i].user < matches[i].opponent));
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
                 var duration = '?';
                 var matchDate = '../../..';
                 if(d){
                   var minutes = d.getMinutes();
                   minutes = minutes < 10 ? '0'+minutes : minutes;
                   matchDate = d.getDate().toString().concat('/', (d.getMonth()+1), '/', d.getFullYear(), ' ', d.getHours(), ':', minutes);
                   if(matches[i].fixed){
                      var diff = Math.abs(matches[i].fixed - d)/1000;
                      var min = Math.floor(diff/60);
                      var sec = Math.floor(diff - min*60);
                      sec = sec < 10 ? '0'+sec: sec;
                      duration = min.toString().concat(':', sec);
                   }
                 }
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
                 data.push({date: matchDate, score: score, duration: duration,
                           firstUser: matches[i].user, secondUser: matches[i].opponent, 
                           firstName: user1?user1.displayName:'---', secondName: user2?user2.displayName:'---', 
                           firstType: type1, secondType: type2, 
                           firstRating: firstRating, secondRating: secondRating, 
                           firstWin: firstWinClass, secondWin: secondWinClass });
             }
          }
          callback(null, data);
      },
      function(matches, callback){
          res.render('allmatch', { languages: require('../translation').languages(), page: 'allmatch', matches: matches });
      }
      ], next);
};
