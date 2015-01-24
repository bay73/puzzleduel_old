var express = require('express');
var config = require('./config');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var logger = require('morgan');
var log = require('./scripts/log')(module);
var passport = require('./scripts/passport');
var app = express();


app.engine('ejs', require('ejs-locals'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(__dirname + '/public/favicon.ico'));
if(app.get('env') == 'development'){
   app.use(logger('dev'));
} else {
   app.use(logger('short'));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var sessionconfig = config.get("session");
sessionconfig.store = require('./scripts/sessionStore');
app.use(session(sessionconfig));

passport.init(app);

require('./translation').translate(app);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components',  express.static(__dirname + 'public/bower_components'));

require('./routes')(app);

passport.routes(app);

app.use(require('./scripts/error').notFound(app));
app.use(require('./scripts/error').errorHandler(app));

var server = app.listen(process.env.PORT || config.get('port'), process.env.IP || config.get('host'), function () {
  var host = server.address().address;
  var port = server.address().port;
  log.info('Puzzleduel app listening at http://%s:%s', host, port);
});

require('./scripts/socket')(server);