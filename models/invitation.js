var async = require('async');
var mongoose = require('../scripts/mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
   user: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
   },
   opponent: {
      type: Schema.Types.ObjectId,
      index: true
   },
   opponentMail: {
      type: String
   },
   challengeDate: {
      type: Date,
      required: true,
   },
   startTime: {
      type: String,
      required: true,
   },
   endTime: {
      type: String,
      required: true,
   },
   status: {
       type: String
   },
   message: {
       type: String
   }
});


exports.Invitation = mongoose.model('Invitation', schema);
