var async = require('async');
var mongoose = require('../scripts/mongoose');
var Schema = mongoose.Schema;

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
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String // new, accepted, decline
  },
  message: {
    type: String
  }
});

exports.Invitation = mongoose.model('Invitation', schema);
