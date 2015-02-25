var util = require('util');
var http = require('http');
var log = require('../scripts/log')(module);
var errorHandler = require('errorhandler');

util.inherits(HttpError, Error);
function HttpError(status, message) {
   Error.apply(this, arguments);
   Error.captureStackTrace(this, HttpError);
   
   this.status = status;
   this.message = message || http.STATUS_CODES[status] || 'Error';
}
HttpError.prototype.name = 'HttpError';
exports.HttpError = HttpError;

function sendHttpError(res, error){
   res.status(error.status);
   if(res.req.headers['x-requested-with'] == 'XMLHttpRequest'){
      res.json(error);
   } else {
      res.render('error', {error: error, languages: require('../translation').languages(), page: 'error'});
   }
}
exports.notFound = function(app){
   return function(req, res, next){
      next(404);
   };
};

exports.errorHandler = function(app){
   return function(err, req, res, next){
      if(typeof err == 'number' ) {
         err = new HttpError(err);
      }
      if(err instanceof HttpError) {
        sendHttpError(res, err);
      } else {
         if(app.get('env') == 'development') {
             errorHandler()(err, req, res, next);
         } else {
            log.error(err);
            sendHttpError(res, new HttpError(500));
         }
      }
   };
};