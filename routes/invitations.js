var Invitation = require('../models/invitation').Invitation;
var User = require('../models/user').User;
var async = require('async');
var validator = require("email-validator");
var HttpError = require('../scripts/error').HttpError;

var pad = function(n){
  if(n < 10) return '0' + n;
  else return n;
};

exports.get = function(req, res, next){
  if(!req.user){
    return next(403);
  }
  async.waterfall([
    function(callback){
      User.getUser(req.user, callback);
    },
    function(user, callback){
      User
      .find()
      .select('id displayName')
      .exec(function(err, data){
        if(err) return callback(err);
        callback(null, user, data);
      });
    },
    function(user, users, callback){
      var userMap = {};
      for(var i=0;i<users.length;i++){
        userMap[users[i]._id] = users[i].displayName;
      }
      callback(null, user, userMap);
    },
    function(user, users, callback){
      Invitation
      .find({$or: [ {user: user}, {opponent: user}]})
      .sort({challengeDate: 1, startTime: 1})
      .exec(function(err, data){
        if(err) return callback(err);
        callback(null, user, users, data);
      });
    },
    function(user, users, invitations, callback){
      var data = [];
      for(var i=0;i<invitations.length;i++)      {
        var d = invitations[i].challengeDate;
        var challengeDate = d.getDate().toString().concat('/', (d.getMonth()+1), '/', d.getFullYear());
        var opponent;
        var status = invitations[i].status;
        if(invitations[i].user.equals(user._id)){
          if (invitations[i].opponent){
            opponent = users[invitations[i].opponent];
          } else{
            opponent = invitations[i].opponentMail;
          }
          if(status=='new'){
            status = 'out';
          }
        } else {
          if(status=='new'){
            status = 'in';
          }
          opponent = users[invitations[i].user];
        }
        data.push({id: invitations[i]._id, date: challengeDate, opponent: opponent, from: invitations[i].startTime, to:  invitations[i].endTime, status: status});
      }
      callback(null, data);
    },
    function(invitations){
      var d = new Date();
      d.setDate(d.getDate()+1);
      var tomorrow = d.getFullYear()+'-'+pad((d.getMonth()+1))+'-'+pad(d.getDate());
      res.render('invitations', {
        languages: require('../translation').languages(),
        page: 'invitations',
        invitations: invitations,
        tomorrow: tomorrow
      });
    }],
    next);
};

var saveNew = function(req, res, next){
  var type = req.body.type;
  var opponentname = req.body.opponentname;
  var calldate = new Date(req.body.calldate);
  var calltimefrom = req.body.calltimefrom;
  var calltimeto = req.body.calltimeto;
  async.waterfall([
    function(callback){
      User.getUser(req.user, callback);
    },
    function(user, callback){
      var opponent = {id: null, mail: null};
        if(type=='byemail'){
          opponent.mail = opponentname;
          if(!validator.validate(opponent.mail)){
            return callback(new HttpError(400, 'Incorrect email!'));
          }
          return callback(null, user, opponent);
        } else {
          User.findOne({displayName: opponentname},function(err, data){
          if(err) {
            return callback(err);
          }
          if(data){
            if(data._id.equals(user._id)){
              return callback(new HttpError(400, 'You cannot call youself!'));
            }
            opponent.id = data._id;
            return callback(null, user, opponent);
          } else {
            return callback(new HttpError(400, 'Incorrect user name!'));
          }
        });
      }
    },
    function(user, opponent, callback){
      var invitation = new Invitation({user: user._id,
        opponent: opponent.id,
        opponentMail: opponent.mail, 
        challengeDate: calldate, 
        startTime: calltimefrom, 
        endTime: calltimeto, 
        status: 'new'});
      invitation.save(function(err){
        if(err){
          return callback(err);
        }
        res.sendStatus(200);
      });    
    }], next);
};

var change = function(req, res, next){
  var id = req.body.id;
  var calltimefrom = req.body.calltimefrom;
  var calltimeto = req.body.calltimeto;
  var status = req.body.status;
  if(status=='declined' || status=='accepted'){
    Invitation.findOneAndUpdate({_id: id}, {$set: {status: status}}, function(err){
        console.log(arguments);
        if(err){
          return next(err);
        }
        res.sendStatus(200);
    });
  } else {
    res.sendStatus(200);
  }
};

exports.post = function(req, res, next){
    if(!req.user) next(403);
    console.log(req.body);
    if(req.body.id){
      return change(req, res, next);
    } else {
      return saveNew(req, res, next);
    }
};
