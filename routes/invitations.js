var Invitation = require('../models/invitation').Invitation;
var User = require('../models/user').User;
var async = require('async');
var validator = require("email-validator");
var HttpError = require('../scripts/error').HttpError;

var pad = function(n){
  if(n < 10) return '0' + n.toString();
  else return n.toString();
};

exports.get = function(req, res, next){
  if(!req.user){
    return next(403);
  }
  async.waterfall([
    function(callback){
      User
      .find()
      .select('id displayName')
      .exec(function(err, data){
        if(err) return callback(err);
        callback(null, data);
      });
    },
    function(users, callback){
      var userMap = {};
      for(var i=0;i<users.length;i++){
        userMap[users[i]._id] = users[i].displayName;
      }
      callback(null, userMap);
    },
    function(users, callback){
      var user = req.user;
      var now = new Date();
      Invitation
      .find({$and : [{$or: [ {user: user}, {opponent: user}]}, {endTime : {$gt: now}}]})
      .sort({startTime: 1})
      .exec(function(err, data){
        if(err) return callback(err);
        callback(null, user, users, data);
      });
    },
    function(user, users, invitations, callback){
      var data = [];
      for(var i=0;i<invitations.length;i++)      {
        var d = invitations[i].startTime;
        var challengeDate = pad(d.getDate().toString()).concat('/', pad(d.getMonth()+1), '/', pad(d.getFullYear()));
        var startTime = pad(invitations[i].startTime.getHours()).concat(':', pad(invitations[i].startTime.getMinutes()));
        var endTime = pad(invitations[i].endTime.getHours()).concat(':', pad(invitations[i].endTime.getMinutes()));
        var opponent;
        var status = invitations[i].status;
        if(status=='accepted'){
          status = 'Invitation accepted';
        }
        if(status=='declined'){
          status = 'Invitation declined';
        }
        if(invitations[i].user.equals(user._id)){
          if (invitations[i].opponent){
            opponent = users[invitations[i].opponent];
          } else{
            opponent = invitations[i].opponentMail;
          }
          if(status=='new'){
            status = 'Invitation out';
          }
        } else {
          if(status=='new'){
            status = 'Invitation in';
          }
          opponent = users[invitations[i].user];
        }
        data.push({id: invitations[i]._id, date: challengeDate, opponent: opponent, from: startTime, to: endTime, status: status});
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
  var calltimefrom = buildDateTime(calldate, req.body.calltimefrom);
  var calltimeto = buildDateTime(calldate, req.body.calltimeto);
  async.waterfall([
    function(callback){
      return checkTimes(calltimefrom, calltimeto, callback)
        ? callback(null)
        : callback(new HttpError(400, 'Wrong date or time!'));
    },
    function(callback){
      var opponent = {id: null, mail: null};
        if(type=='byemail'){
          opponent.mail = opponentname;
          return validator.validate(opponent.mail)
            ? callback(null, opponent)
            : callback(new HttpError(400, 'Incorrect email!'));
        } else {
          User.findOne({displayName: opponentname},function(err, data){
          if(err) {
            return callback(err);
          }
          if(data){
            if(data._id.equals(req.user._id)){
              return callback(new HttpError(400, 'You cannot call youself!'));
            }
            opponent.id = data._id;
            return callback(null, opponent);
          } else {
            return callback(new HttpError(400, 'Incorrect user name!'));
          }
        });
      }
    },
    function(opponent, callback){
      var invitation = new Invitation({user: req.user._id,
        opponent: opponent.id,
        opponentMail: opponent.mail, 
        startTime: calltimefrom, 
        endTime: calltimeto, 
        status: 'new'});
      invitation.save(function(err){
        return err
          ? callback(err)
          : res.sendStatus(200);
      });    
    }], next);
};

var change = function(req, res, next){
  var id = req.body.id;
  var newData = {status : req.body.status};
  var calltimefrom = req.body.calltimefrom;
  var calltimeto = req.body.calltimeto;
  Invitation.findOne({_id: id}, function(err, invitation){
    if(err) {
      return next(err);
    }
    if(!invitation) {
      return next(404);
    }
    newData.startTime = calltimefrom ? buildDateTime(invitation.startTime, calltimefrom) : invitation.startTime;
    newData.endTime = calltimeto ? buildDateTime(invitation.startTime, calltimeto) : invitation.endTime;

    if(invitation.user.equals(req.user._id)){
      return changeOut(invitation, newData, req, res, next);
    } else if (invitation.opponent == null){
      invitation.opponent = req.user._id;
      return changeIn(invitation, newData, req, res, next);
    } else if (invitation.opponent.equals(req.user._id)){
      return changeIn(invitation, newData, req, res, next);
    }
  });
};

function changeOut(invitation, newData, req, res, next){
  if(invitation.status == 'new'){
    if(newData.status == 'declined'){
      invitation.status = 'declined';
      return save(invitation, req, res, next);
    }
    if (newData.status == 'accepted'){
      return next(new HttpError(400, 'You cannot accept this invitation!'));
    }
    return saveDate(invitation, newData, req, res, next);
  } else if(invitation.status == 'accepted'){
    if(newData.status == 'declined') {
      if(invitation.startTime < new Date()){
        return next(new HttpError(400, 'Match already started!'));
      }
      invitation.status = 'declined';
      return save(invitation, req, res, next);
    }
    if(newData.startTime < invitation.startTime || newData.endTime > invitation.endTime){
      return next(new HttpError(400, 'You cannot extend accepted interval!'));
    }
    return saveDate(invitation, newData, req, res, next);
  } else if(invitation.status == 'declined'){
    invitation.status = 'new';
    return saveDate(invitation, newData, req, res, next);
  }
  return next(500);
}

function changeIn(invitation, newData, req, res, next){
  console.log('changeIn', invitation.status);
  if(invitation.status == 'new'){
    if(newData.status == 'declined'){
      invitation.status = 'declined';
      return save(invitation, req, res, next);
    }
    if(newData.startTime < invitation.startTime || newData.endTime > invitation.endTime){
      return reverse(invitation, newData, req, res, next);
    } else {
      invitation.status = 'accepted';
      return saveDate(invitation, newData, req, res, next);
    }
  } else if(invitation.status == 'accepted'){
    if(newData.status == 'declined') {
      if(invitation.startTime < new Date()){
        return next(new HttpError(400, 'Match already started!'));
      }
      invitation.status = 'declined';
      return save(invitation, req, res, next);
    }
    if(newData.startTime < invitation.startTime || newData.endTime > invitation.endTime){
      return next(new HttpError(400, 'You cannot extend accepted interval!'));
    }
    return saveDate(invitation, newData, req, res, next);
  } else if(invitation.status == 'declined'){
    return reverse(invitation, newData, req, res, next);
  }
  return next(500);
}

function reverse(invitation, newData, req, res, next){
  invitation.status = 'new';
  invitation.opponent = invitation.user;
  invitation.user = req.user._id;
  return saveDate(invitation, newData, req, res, next);
}

function saveDate(invitation, newData, req, res, next){
  console.log('saveDate', newData);
  if(!checkTimes(newData.startTime, newData.endTime)){
    return next(new HttpError(400, 'Wrong date or time!'));
  }
  invitation.startTime = newData.startTime;
  invitation.endTime = newData.endTime;
  return save(invitation, req, res, next);
}

function save(invitation, req, res, next){
  return invitation.save({}, function(err){
    return err ? next(err) : res.sendStatus(200);
  });
}

function checkTimes(timeFrom, timeTo){
  var now = new Date();
  return timeFrom && timeTo && timeFrom > now && timeFrom < timeTo;
}

function buildDateTime(date, time){
  var d = new Date(date);
  d.setHours(time.substring(0,2));
  d.setMinutes(time.substring(3,5));
  return d;
}

exports.post = function(req, res, next){
  if(!req.user) next(403);
  console.log(req.body.id);
  return req.body.id
    ? change(req, res, next)
    : saveNew(req, res, next);
};
