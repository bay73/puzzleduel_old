var matchData = require('../scripts/server.js').matchData;
var queueData = require('../scripts/server.js').queueData;

exports.get = function(req, res, next){
  if(req.user && (req.user.id=='54ba6faadf5e31b2314364be' || req.user.id=='54fc120cb671b60300839a54')){
    res.render('monitor', { languages: require('../translation').languages(), page: 'monitor', queue: queueData(), matches: matchData(), invitationCount: 0 });
  } else {
    next(404);
  }
};
