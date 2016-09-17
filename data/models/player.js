var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var playerSchema = new Schema({
  contactId: String,
  contactName: String,
  state: String,
  handle: String,
  dateRegistered: Date,
  refererId: String,
  source: String
});


playerSchema.statics.findOneById = function(id) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.findOne({ contactId: id }, function(err, player) {
      resolve(player);
    });
  });
};

playerSchema.methods.isNew = function() {
  return this.state = 'new';
};

SOURCE_TELEGRAM = 'Telegram';
SOURCE_MESSENGER = 'MessengerV2';

module.exports = mongoose.model('Match', playerSchema);
