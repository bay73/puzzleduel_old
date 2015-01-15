var path = require('path');
var util = require('util');
var http = require('http');
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
      res.render('error', {title: 'Error', error: error});
   }
}
exports.notFound = function(req, res, next){
   next(new HttpError(404, 'Page ' + path.basename(req.url) + ' not found!'));
}

exports.errorHandler = function(err, req, res, next){
   console.log(err);
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
}