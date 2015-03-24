var nodemailer = require('nodemailer');
var config = require('../config');

var transporter = nodemailer.createTransport({
  service: config.get('mail:service'),
  auth: {
    user: config.get('mail:user'),
    pass: config.get('mail:password')
  }
});

var pad = function(n){
  if(n < 10) return '0' + n.toString();
  else return n.toString();
};

var sendInvitationMail = function(from, to, invitation){
  var d = invitation.startTime;
  var challengeDate = pad(d.getDate().toString()).concat('/', pad(d.getMonth()+1), '/', pad(d.getFullYear()));
  var startTime = pad(d.getHours()).concat(':', pad(d.getMinutes()));
  transporter.sendMail({
    from: config.get('mail:user'),
    to: to,
    subject: from + ' invites you to play puzzle duel',
    text: 'On ' + challengeDate + ' at ' + startTime + ' ' + from + 
      ' invites you to play puzzle duel. Go to https://puzzleduel.herokuapp.com/invitations?id=' + invitation._id + ' to accept or decline the invitation.'
  }, function(){
    console.log(arguments);
  });
};

module.exports.sendInvitationMail = sendInvitationMail;