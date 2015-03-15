var async = require('async');
var mongoose = require('../scripts/mongoose');
var Schema = mongoose.Schema;
    
var INITIAL_RATING=100;
var MATCH_COST=3;

var userschema = new Schema({
  type: {
    type: String,
    required: true
  },
  id: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: INITIAL_RATING
  }
});

userschema.index({id: 1, type: 1});

var matchschema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  opponent: {
    type: Schema.Types.ObjectId,
  },
  opponentName: {
    type: String,
  },
  started: {
    type: Date
  },
  fixed: {
    type: Date,
    default: Date.now
  },
  win: {
    type: Boolean
  },
  reason: {
    type: String
  },
  pro: {
    type: Number
  },
  contra: {
    type: Number
  },
  ratingChange: {
    type: Number
  }
});

var userFromSocket = function(socket){
  if(socket.user) {
    return socket.user;
  } else {
    return {provider: 'anonym', _id: null, displayName: socket.name, rating: INITIAL_RATING};
  }
};

matchschema.statics.addMatch = function(started, sockets, counter, result, resultreason, callback){
  async.waterfall([
    function(callback) {
      var user0 = userFromSocket(sockets[0]);
      var user1 = userFromSocket(sockets[1]);
      var change = [0, 0];
      if(user1 && user0){
        if(user0.rating <= 0) user0.rating = INITIAL_RATING;
        if(user1.rating <= 0) user1.rating = INITIAL_RATING;
        var sumR = user0.rating + user1.rating;
        var sumC = counter[0] + counter[1] + 2*MATCH_COST;
        var expected0 = user0.rating * sumC / sumR;
        var expected1 = user1.rating * sumC / sumR;
        change[0] = counter[0] + MATCH_COST - expected0;
        change[1] = counter[1] + MATCH_COST - expected1;
        if(typeof(result) != 'undefined'){
          if(result) {
            change[0] += MATCH_COST;
            change[1] -= MATCH_COST;
            if(change[0] < 0){
              change[0] = 0;
              change[1] = 0;
            }
          } else {
            change[0] -= MATCH_COST;
            change[1] += MATCH_COST;
            if(change[1] < 0){
              change[1] = 0;
              change[0] = 0;
            }
          }
        }
      }
      console.log('Result: ', counter, '[',user0.rating,'>',change[0], ', ',user1.rating,'>',change[1],']');
      return callback(null, user0, user1, change);
    },
    function(user0, user1, change, callback) {
      if(user0.provider != 'anonym') {
        var match = new Match({user: user0._id, opponent: user1._id, opponentName: user1.displayName, started: started, win: result, reason: resultreason, pro: counter[0], contra: counter[1], ratingChange: change[0]});
        match.save();
      }
      return callback(null, user0, user1, change);
    },
    function(user0, user1, change, callback) {
      if(user1.provider != 'anonym') {
        var result2;
        if(typeof(result) != 'undefined'){
          result2 = !result;
        }
        var match = new Match({user: user1._id, opponent: user0._id, opponentName: user0.displayName, started: started, win: result2, reason: resultreason, pro: counter[1], contra: counter[0], ratingChange: change[1]});
        match.save();
      }
      return callback(null, user0, user1, change);
    },
    function(user0, user1, change, callback) {
      user0.rating += change[0];
      user1.rating += change[1];
      if(user0.provider == 'anonym'){
        if(user1.provider != 'anonym'){
          user1.save();
        }
      } else {
        if(user0._id.equals(user1._id)){
          if(user0.rating < user1.rating) {
            user0.save();
          } else {
            user1.save();
          }
        } else {
          user0.save();
          if(user1.provider != 'anonym'){
            user1.save();
          }
        }
      }
    }
  ], callback);
};

var AllUser = mongoose.model('AllUser', userschema);
var Match = mongoose.model('Match', matchschema);

exports.AllUser = AllUser;
exports.Match = Match;
exports.INITIAL_RATING=INITIAL_RATING;
