var async = require('async');
var mongoose = require('../scripts/mongoose'),
    Schema = mongoose.Schema;
    
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
      required: true
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
    var user = {type: 'anonym', id: socket.name, displayName: socket.name};
    if(socket.user) {
        if(socket.user.provider) {
            user = {type: socket.user.provider, id: socket.user.id, displayName: socket.user.displayName};
        } else {
            user = {type: socket.user.type, id: socket.user.id, displayName: socket.user.displayName};
        }
    }
    return user;
}

matchschema.statics.addMatch = function(started, sockets, counter, result, resultreason, callback){
    async.waterfall([
        function(callback){
            var userPattern = userFromSocket(sockets[0]);
            AllUser.findOne({type: userPattern.type, id: userPattern.id},function(err, user){
                if(err) return callback(err);
                if(user){
                    if(user.displayName != userPattern.displayName){
                        user.displayName = userPattern.displayName;
                    }
                    return callback(null, user);
                } else {
                    user = new AllUser(userPattern);
                    return callback(null, user);
                }
            });
        },
        function(user0, callback) {
            var userPattern = userFromSocket(sockets[1]);
            AllUser.findOne({type: userPattern.type, id: userPattern.id},function(err, user){
                if(err) return callback(err);
                if(user){
                    if(user.displayName != userPattern.displayName){
                        user.displayName = userPattern.displayName;
                    }
                    return callback(null, user0, user);
                } else {
                    user = new AllUser(userPattern);
                    return callback(null, user0, user);
                }
            });
        },
        function(user0, user1, callback) {
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
                        }
                    } else {
                        change[0] -= MATCH_COST;
                        change[1] += MATCH_COST;
                        if(change[1] < 0){
                            change[1] = 0;
                        }
                    }
                }
            }
            console.log('Result: ', counter, '[',user0.rating,'>',change[0], ', ',user1.rating,'>',change[1],']');
            return callback(null, user0, user1, change);
        },
        function(user0, user1, change, callback) {
            var match = new Match({user: user0, opponent: user1, started: started, win: result, reason: resultreason, pro: counter[0], contra: counter[1], ratingChange: change[0]});
            match.save();
            return callback(null, user0, user1, change);
        },
        function(user0, user1, change, callback) {
            var match = new Match({user: user1, opponent: user0, started: started, win: !result, reason: resultreason, pro: counter[1], contra: counter[0], ratingChange: change[1]});
            match.save();
            return callback(null, user0, user1, change);
        },
        function(user0, user1, change, callback) {
            user0.rating += change[0];
            user1.rating += change[1];
            if(user0.id == user1.id && user0.type == user1.type){
                if(user0.rating < user1.rating) user0.save();
                else user1.save();
            } else {
                user0.save();
                user1.save();
            }
        }
    ], callback
    );
};

var AllUser = mongoose.model('AllUser', userschema);
var Match = mongoose.model('Match', matchschema);

exports.AllUser = AllUser;
exports.Match = Match;
