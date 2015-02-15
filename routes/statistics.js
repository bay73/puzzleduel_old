var async = require('async');
var AllUser = require('../models/match').AllUser;
var Match = require('../models/match').Match;

exports.get = function(req, res, next){
   var fromStr = req.param('from');
   var toStr = req.param('to');
   if(toStr){
       var to = new Date(toStr.substring(0,4), (toStr.substring(4,6)-1),toStr.substring(6,8)) + 60*60*24*1000;
   }else{
       to = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
   }
   if(fromStr){
       var from = new Date(fromStr.substring(0,4),(fromStr.substring(4,6)-1),fromStr.substring(6,8));
   }else{
       from = new Date(to - 7*24*60*60*1000);
   }
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
        .select('_id id type rating displayName')
        .sort({type: -1, rating: -1})
        .exec(function(err, data){
            if(err) return callback(err);
            callback(null, data);
        });
      },
      function(users, callback){
          var userMap = {};
          for(var i=0;i<users.length;i++){
              users[i].matches = 0;
              users[i].wins = 0;
              users[i].duration = 0;
              users[i].days = [];
              for(var d=0;d<(to-from)/(1000*24*60*60);d++){
                  users[i].days[d]=0;
              }
              userMap[users[i]._id] = i;
          }
          callback(null, users, userMap);
      },
      function(users, userMap, callback){
         Match
         .find({started : {"$gte": from.toString(), $lt: to.toString()}})
         .select('user started fixed win')
         .exec(function(err, data){
            if(err) return callback(err);
            callback(null, users, userMap, data);
         });
         
      },
      function(users, userMap, matches, callback){
          var total={displayName: 'Total',matches:0, wins: 0, duration: 0, days: []};
          for(var d=0;d<(to-from)/(1000*24*60*60);d++){
              total.days[d]=0;
          }
          for(var i=0;i<matches.length;i++){
             var index = userMap[matches[i].user];
             if(index != undefined){
                 users[index].matches++;
                 total.matches += 1/2;
                 if(matches[i].win){
                    users[index].wins++;
                    total.wins++;
                 }
                 if(matches[i].fixed && matches[i].started){
                     users[index].duration += Math.abs(matches[i].fixed - matches[i].started);
                     total.duration += (Math.abs(matches[i].fixed - matches[i].started))/2;
                 }
                 if(matches[i].started){
                    var day = Math.floor((matches[i].started - from)/(1000*24*60*60));
                    if(total.days[day]!=undefined){
                        users[index].days[day]++;
                        total.days[day] +=1/2;
                    }
                 }
             }
          }
          users.push(total);
          callback(null, users);
      },
      function(users, callback){
          var typeMap=[];
          for(var i=0;i<users.length;i++){
              var diff = users[i].duration/1000;
              var min = Math.floor(diff/60);
              var sec = Math.floor(diff - min*60);
              sec = sec < 10 ? '0'+sec: sec;
              users[i].duration = min.toString().concat(':', sec);
              if(typeMap[users[i].type]) typeMap[users[i].type]++;
              else typeMap[users[i].type]=1;
          }
          var types=[];
          for(var type in typeMap){
              types.push({type: type, count: typeMap[type]});
          }
          res.render('statistics', { languages: require('../translation').languages(), page: 'statistics', users: users, types: types });
      }
  ], next);
};
