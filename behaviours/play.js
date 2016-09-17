var Player = require('../data/models/player.js');
var Message = require('../data/models/message.js');
var matchers = require('../util/matchers.js');
var machina = require('machina');
var ongair = require('ongair');

var play = {

  getPlayer: function(playerId, playerName, source) {
    return new Promise(function(resolve, reject) {
      Player.findOneById(playerId)
        .then(function (player) {
          if (!player) {

            name = playerName
            if (source == 'Telegram')
              name = name.replace(/ *\([^)]*\) */g, "");

            player = new Player({ contactId: playerId, contactName: name, source: source, state: 'new' })
            player.save();
          }
          resolve(player);
        });
    });
  },

  introduction: function(player) {
    return new Promise(function(resolve, reject) {
      var hi = "Hi";

    });
  },

  analyze: function(player, msg) {
    return new Promise(function(resolve, reject) {
      Message.findOrCreate(msg.id, player.id, 'IN', 'Text', msg.text, player.source)
        .then(function(message) {
          console.log("Saved the message", message);
          resolve(player, msg);
        });
    });
  },

  advance: function(player, message) {
    var self = this;
    machine = new machina.Fsm({

      initialize: function(options) {
      },

      namespace: 'tubet.registration',

      initialState: 'start',

      states : {

        // The start of the process
        start: {
          // ok we need to say some salutations
          _onEnter: function() {
            self.introduction(player);
          }
        }
      }
    });
  },

  START_KEYWORDS: ['/start'],
  STATE_NEW: 'new',
}

function sendMessage(to, message, options) {
  return new Promise(function(resolve, reject) {
    var client = new ongair.Client(process.env.ONGAIR_TOKEN);
    client.sendMessage(to, message, options)
      .then(function(id) {

      });
  });
}

module.exports = play;
