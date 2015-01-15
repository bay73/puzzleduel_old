var express = require('express'),
    url = require("url"),
    path = require('path'),
//    mime = require('mime'),
//    fs = require('fs'),
    io = require('socket.io'),
    sudokuServer = require('./js/server.js');

var app = express();
var server = app.listen(3000, function (req, res) {})
var socket = io(server);

app.get([/js\/.*/,/css\/.*/,/img\/.*/,'/'],function (req, res) {
   var dir = "/";
   var uri = url.parse(req.url).pathname;
   if (uri == "/") {
      uri = "play.html";
   }
   var filename = path.join(dir, uri);
   console.log(filename);
   res.sendFile(__dirname + filename);
/*   fs.readFile(__dirname + filename,
   function (err, data) {
      if (err) {
         res.writeHead(500);
         return res.end('Error loading ' + filename);
      }
      res.setHeader('content-type', mime.lookup(filename));
      res.writeHead(200);
      res.end(data);
   }); */
});



socket.on('connection', sudokuServer);
