var async = require('async');
var url = require('url');
var User = require('../models/user').User;
var Match = require('../models/match').Match;
var AllUser = require('../models/match').AllUser;

exports.get = function(req, res, next){
  if(req.user && (req.user.id=='54ba6faadf5e31b2314364be' || req.user.id=='54fc120cb671b60300839a54')){
    var url_parts = url.parse(req.url, true);
    if(url_parts.query.query) {
      showData(url_parts.query.query, req, res, next);
    } else if(url_parts.query.run) {
      if(url_parts.query.run=='setLocal'){
        setLocal(req, res, next);
      }
      if(url_parts.query.run=='convertAllUsers'){
        convertAllUsers(req, res, next);
      }
      if(url_parts.query.run=='convertAllMatch'){
        convertAllMatch(req, res, next);
      }
    } else {
      res.render('admin', { languages: require('../translation').languages(), page: 'admin', data: [] });
    }
  } else {
    next(404);
  }
};

var showData = function(query, req, res, next){
  var Collection = User;
  if(query=='matches'){
    Collection = Match;
  } else if(query=='allusers'){
    Collection = AllUser;
  }
  Collection
    .find({})
    .exec(function(err, data){
      if(err){
        return next(err);
      } 
      res.render('admin', { languages: require('../translation').languages(), page: 'admin', data: stringify(data) });
    });
};

var stringify = function(data){
  var res = [];
  for(var i=0;i<data.length;i++){
    res.push(JSON.stringify(data[i]));
  }
  return res;
};

var setLocal = function(req, res, next){
  User.update({provider: {$exists: false}}, {$set: {provider: 'local'}}, {multi: true}, function(err){
    if(err){
      console.log('Error updating users:',err);
      next(err);
    }
    console.log('All users updated');
    showData('users', req, res, next);
  });
};

var convertAllUsers = function(req, res, next){
  AllUser
    .find()
    .exec(function(err, data){
      if(err){
        return next(err);
      }
      for(var i=0;i<data.length;i++){
        changeUser(data[i]);
      }
      showData('users', req, res, next);
    });
};

var changeUser = function(allUserRow){
  if(allUserRow.type=='anonym') {
    return;
  } else if(allUserRow.type=='bot') {
    User.findOneAndUpdate(
      {provider:allUserRow.type, username: allUserRow.id},
      {$set: {rating: allUserRow.rating}},
      function(err, user){
        if(err){
          console.log('Error updating user ', allUserRow, err);
        } else {
          if(!user){
            user = new User({provider:allUserRow.type, username: allUserRow.id, displayName: allUserRow.displayName, rating: allUserRow.rating});
            user.save();
            console.log('Create new user', user);
          } else{
            console.log('Updated user', user.displayName);
          }
        }
      }
    );
  } else if(allUserRow.type=='local') {
    User.findOneAndUpdate(
      {provider:allUserRow.type, _id: allUserRow.id},
      {$set: {rating: allUserRow.rating}},
      function(err, user){
        if(err){
          console.log('Error updating user ', allUserRow, err);
        } else {
          if(!user){
            console.log('Could not find user', allUserRow);
          } else{
            console.log('Updated user', user.displayName);
          }
        }
      }
    );
  } else {
    User.findOneAndUpdate(
      {provider:allUserRow.type, username: allUserRow.id},
      {$set: {rating: allUserRow.rating}},
      function(err, user){
        if(err){
          console.log('Error updating user ', allUserRow, err);
        } else {
          if(!user){
            console.log('Could not find user', allUserRow);
          } else{
            console.log('Updated user', user.displayName);
          }
        }
      }
    );
  }
};

var convertAllMatch = function(req, res, next){
  async.waterfall([
    function(callback){
      User
        .find()
        .exec(function(err, data){
            if(err) return callback(err);
            callback(null, data);
        });
    },
    function(users, callback){
      AllUser
        .find()
        .exec(function(err, data){
            if(err) return callback(err);
            var allUserMap = {};
            for(var i=0;i<data.length;i++){
              if(data[i].type!='anonym' && data[i].type!='local'){
                for(var j=0;j<users.length;j++){
                  if(users[j].provider==data[i].type && users[j].username==data[i].id){
                    data[i].id=users[j]._id;
                  }
                }
              }
              allUserMap[data[i]._id] = data[i];
            }
            callback(null, allUserMap);
        });
    },
    function(users, callback){
      Match
        .find()
        .sort({started: -1})
        .exec(function(err, data){
          if(err) return callback(err);
          callback(null, users, data);
        });
    },
    function(users, matches, callback){
      for(var i=0;i<matches.length;i++){
        var match = matches[i];
        var user = users[match.user];
        if(user){
          var userType = user.type;
          if(userType == 'anonym'){
            match.user = null;
          } else {
            match.user = user.id;
          }
          match.userName = user.displayName;
          var opponent = users[match.opponent];
          if(opponent){
            var opponentType = opponent.type;
            if(opponentType != 'anonym'){
              match.opponent = opponent.id;
            } else {
              match.opponent = null;
            }
            match.opponentName = opponent.displayName;
          } else {
            console.log('Match ' + match._id + ': opponent unknown');
          }
          match.save(function (err, product) {
            if (err) console.log('Error saving match ' + match._id + ':', err);
            else console.log('Match ' + match._id + ' changed');
          });
        }
      }
      callback(null);
    },
    function(callback){
      showData('matches', req, res, next);
    }
  ], next);
};

