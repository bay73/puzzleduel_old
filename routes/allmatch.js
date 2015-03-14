var async = require('async');
var url = require('url');
var User = require('../models/user').User;
var Match = require('../models/match').Match;

exports.get = function(req, res, next){
  var url_parts = url.parse(req.url, true);
  var userId = url_parts.query.user;
  async.waterfall([
    function(callback){
      if(req.user && (req.user.id=='54ba6faadf5e31b2314364be' || req.user.id=='942960155727747')){
        callback(null);
      } else {
        callback(404);
      }
    },
    function(callback){
      User
        .find()
        .select('_id provider displayName')
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
        if(userId && users[i]._id == userId ){
          user = users[i];
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
          .select('user opponent opponentName started fixed win reason pro contra ratingChange')
          .exec(function(err, data){
            if(err) {
              return callback(err);
            }
            callback(null, user, users, data);
          });
      } else {
        Match
          .find()
          .sort({started: -1})
          .limit(1000)
          .select('user opponent opponentName started fixed win reason pro contra ratingChange')
          .exec(function(err, data) {
            if(err) {
              return callback(err);
            }
            callback(null, user, users, data);
          });
      }
    },
    function(user, users, matches, callback){
      var data = [];
      for(var i=0;i<matches.length;i++){
        var user1 = users[matches[i].user];
        var type1 = user1?user1.provider:'undefined';
        var type2 = 'anonym';
        var user2;
        if(matches[i].opponent){
          user2 = users[matches[i].opponent];
          type2 = user2?user2.provider:'undefined';
        }
        var show = (type2 == 'anonym' || type2 == 'undefined') ||
          ((type1 != 'bot' && type2 == 'bot') ||
          (type1 != 'bot' && type2 != 'bot' && matches[i].user < matches[i].opponent) ||
          (type1 == 'bot' && type2 == 'bot' && matches[i].user < matches[i].opponent));
        if(user || show) {
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
                     firstName: user1?user1.displayName:'---', secondName: matches[i].opponentName,
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
