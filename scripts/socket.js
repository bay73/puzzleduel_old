var io = require('socket.io');
var sudokuServer = require('./server.js');
var config = require('../config');
var cookie = require('cookie');
var async = require('async');
var sessionStore = require('./sessionStore');
var cookieParser = require('cookie-parser');


var loadSession = function(sid, callback) {
    sessionStore.load(sid, function(err, session){
        if(arguments.length === 0){
            return callback(null, null);
        } else {
            return callback(err, session);
        }
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
                    return callback(null);
                }
                var sidCookie = cookies[config.get('session:name')];
                if(!sidCookie) {
                    return callback(null);
                }
                var sid = cookieParser.signedCookie(sidCookie, config.get('session:secret'));
                if(!sid) {
                    return callback(null);
                }
                loadSession(sid, callback);
            },
            function(session, callback) {
                if(session && session.passport) {
                    socket.user = session.passport.user;
                }
                callback(null);
            }
            ], function(err) {
                if(!err) {
                    return next();
                }
                next(err);
            }
        );
    });

    socket.on('connection', sudokuServer);
    return socket;
};
