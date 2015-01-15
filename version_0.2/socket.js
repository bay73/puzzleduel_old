var app = require('http').createServer(handler)
var url = require("url");
var path = require('path');
var mime = require('mime');
var io = require('socket.io')(app);
var fs = require('fs');
var sudokuServer = require('./js/server.js');

var counter = 0;

app.listen(3000);

function handler (req, res) {
  var dir = "/";
  var uri = url.parse(req.url).pathname;
  if (uri == "/")
  {
      uri = "index.html";
  }
  var filename = path.join(dir, uri);
  fs.readFile(__dirname + filename,
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading ' + filename);
    }
    res.setHeader('content-type', mime.lookup(filename));
    res.writeHead(200);
    res.end(data);
  });
}

io.on('connection', sudokuServer);
