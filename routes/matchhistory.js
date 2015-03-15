var async = require('async');
var User = require('../models/user').User;
var Match = require('../models/match').Match;

exports.get = function(req, res, next){
  if(!req.user){
    return next(403);
  }
  async.waterfall([
    function(callback){
      var user = req.user;
      Match
        .find({user: user})
        .sort({started: -1})
        .limit(50)
        .select('opponent opponentName started fixed win reason pro contra ratingChange')
        .exec(function(err, data){
          if(err) {
            return callback(err);
          }
          callback(null, data);
        });
    },
    function(matches, callback){
      var data = [];
      for(var i=0;i<matches.length;i++){
        if( !req.user._id.equals(matches[i].opponent) || !matches[i].win) {
          var score = matches[i].pro.toString().concat(' : ', matches[i].contra.toString());
          if (matches[i].reason != 'finish'){
            score = matches[i].reason;
          }
          var rating = Math.round(matches[i].ratingChange).toString();
          if(Math.round(matches[i].ratingChange) > 0){
            rating = '+' + rating;
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
              duration = min.toString().concat(':', sec);
            }
          }
          var result = '';
          if(typeof(matches[i].win)==='undefined') {
            result = 'draw';
          } else {
            if(matches[i].win) result = 'win';
            else result = 'loose';
          }
          data.push({date: matchDate, displayName: matches[i].opponentName, score: score, rating: rating, result: result, duration: duration });
        }
      }
      callback(null, data);
    },
    function(matches, callback){
      res.render('matchhistory', { languages: require('../translation').languages(), page: 'matchhistory', matches: matches });
    }
  ], next);
};
