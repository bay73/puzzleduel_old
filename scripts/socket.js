var io = require('socket.io');
var sudokuServer = require('./server.js');
var config = require('../config');
var cookie = require('cookie');
var async = require('async');
var sessionStore = require('./sessionStore');
var cookieParser = require('cookie-parser');
var User = require('../models/user').User;


var loadSession = function(sid, callback) {
  sessionStore.load(sid, function(err, session){
    return arguments.length === 0
      ? callback(null, null)
      : callback(err, session);
  });
};

module.exports = function(server) {
  var socket = io(server, {pingTimeout: 20000, pingInterval: 9000});
  socket.use(function(socket, next){
    var handshake = socket.request;
    async.waterfall([
      function(callback) {
        var cookies = cookie.parse(handshake.headers.cookie || '');
        if(!cookies) {
          return callback(null, null);
        }
        var sidCookie = cookies[config.get('session:name')];
        if(!sidCookie) {
          return callback(null, null);
        }
        var sid = cookieParser.signedCookie(sidCookie, config.get('session:secret'));
        if(!sid) {
          return callback(null, null);
        }
        return loadSession(sid, callback);
      },
      function(session, callback) {
        var userId = (session && session.passport)? session.passport.user : null;
        if(userId) {
          User.findById(userId, function(err,user){
            socket.user = (!err)? user : null;
            callback(null);
          });
        } else {
          callback(null);
        }
      }
    ], next);
  });

  socket.on('connection', sudokuServer);
  return socket;
};
