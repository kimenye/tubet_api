var machina = require('machina');
var ongair = require('ongair');
var replies = require('./replies.js');
var ai = require('./ai.js');

var player, message;
var Rules = machina.Fsm.extend({
  initialState: 'unknown',
  states: {
    'unknown': {
      _onEnter: function() {
      }
    },
    'new' : {
      _onEnter: function() {

        sendTermsAndConditions(player)
          .then(function() {
            player.state = 'terms';
            player.termsAccepted = false;
            player.save();
          });

      }
    },
    'terms' : {
      _onEnter: function() {
        checkTermsAndConditions(player, message.text)
          .then(function(accepted) {

            if (accepted)
              player.state = 'personalize';

            player.termsAccepted = accepted;
            player.save();
          });
      }
    },
    'personalize' : {
      _onEnter: function() {
        checkPersonalization(player, message.text)
      }
    },
    'tutorial': {
      _onEnter: function() {
        checkTutorialAnswer(player, message.text)
          .then(function() {
            player.state = 'credits';
            player.save();
          });
      }
    },
    'credits': {
      _onEnter: function() {
        checkCreditsAnswer(player, message.text)
          .then(function() {
            player.state = 'waiting';
            player.credits = 100;
            player.save();
          })
      }
    },
    'waiting': {
      _onEnter: function() {
        // send(player.to(), replies.waiting);
        waiting(player, replies.waiting);
      }
    }
  },
  load: function(p, m) {
    try
    {
      state = p.state;
      player = p;
      message = m;
      this.transition(state);
    }
    catch(ex) {
      console.log("Error", ex);
    }
  }
});

function waiting(player, text) {
  return new Promise(function(resolve, reject) {
    send(player.to(), replies.texts.waiting)
      .then(function() {
        resolve(true);
      });
  })
}

function tutorial(player, team) {
  return new Promise(function(resolve, reject) {
    send(player.to(), replies.texts.teamSelected)
      .then(function() {
        image = replies.gifs[team.code.toLowerCase()];
        sendImage(to, image, 'image/gif')
          .then(function() {
            send(player.to(), replies.texts.bettingIntro)
              .then(function() {
                send(player.to(), replies.texts.explainerBet)
                  .then(function() {
                    send(player.to(), replies.texts.explainerOdds)
                      .then(function() {
                        send(player.to(), replies.texts.explainerOddsExample, 'Liverpool Win,Everton Win,Draw')
                          .then(function() {
                            resolve(true);
                          })
                      })
                  });
              })
          })
      })
  });
}

function sendTermsAndConditions(player) {
  return new Promise(function(resolve, reject) {
    to = player.to()
    send(to, personalize(replies.texts.hi, player.contactName))
      .then(function() {
        send(to, replies.texts.disclaimer)
          .then(function() {
            send(to, replies.texts.prompt, 'Yes,No')
              .then(function() {
                resolve(true);
              })
          })
      })
  });
}

function checkPersonalization(player, answer) {
  to = player.to();
  return new Promise(function(resolve, reject) {
    ai.getTeam(answer)
      .then(function(team) {
        if (team) {
          tutorial(player, team)
            .then(function() {
              player.state = 'tutorial';
              player.teamId = team.id;
              player.save();
            })
        } else {
          send(to, replies.texts.teamNotFound + answer)
            .then(function() {
              send(to, replies.texts.teamTryAgain);
            })
        }
      })
  });
}

function checkTermsAndConditions(player, answer) {
  to = player.to()
  return new Promise(function(resolve, reject) {
    ai.agrees(answer)
      .then(function(yes) {
        if (yes) {
          send(to, replies.texts.termsAccepted)
            .then(function() {
              send(to, replies.texts.personalization)
                .then(function() {
                  resolve(true);
                })
            })
        }
        else {
          send(to, replies.texts.termsRejected, 'Yes,No')
            .then(function() {
              resolve(false);
            })
        }
      })
  });
}

function checkTutorialAnswer(player, answer) {
  return new Promise(function(resolve, reject) {
    resp = answer.toLowerCase() == "Liverpool Win".toLowerCase() ? replies.texts.exampleCorrect : replies.texts.exampleWrong;
    send(player.to(), resp)
      .then(function() {
        send(player.to(), replies.texts.exampleExplainer)
          .then(function() {
            send(player.to(), replies.texts.creditsExplainer, '325,225,325')
              .then(function() {
                resolve(true);
              })
          })
      })
  })
}

function checkCreditsAnswer(player, answer) {
  to = player.to();
  return new Promise(function(resolve, reject) {
    resp = answer == '225' ? replies.texts.exampleResultsCorrect : replies.texts.exampleResultsWrong;

    send(to, resp)
      .then(function() {
        send(to, replies.texts.exampleResultsExplainer)
          .then(function() {
            send(to, replies.texts.startingCredits)
              .then(function() {
                send(to, replies.texts.goodLuck)
                  .then(function() {
                    resolve(true);
                  })
              })
          })
      })
  });
}

function sendImage(to, url, type) {
  return new Promise(function(resolve, reject) {
    var client = new ongair.Client(process.env.ONGAIR_TOKEN);
    if (url)
      client.sendImage(to, url, type)
        .then(function(id) {
          resolve(id);
        })
        .catch(function(ex) {
          reject(ex);
        })
    else {
      resolve(false);
    }
  });
}

function send(to, message, options) {
  return new Promise(function(resolve, reject) {
    var client = new ongair.Client(process.env.ONGAIR_TOKEN);
    // console.log("Sending", message);
    client.sendMessage(to, message, options)
      .then(function(id) {
        resolve(id);
      })
      .catch(function (ex) {
        reject(ex);
      });
  });
}

function personalize(text, name) {
  return text.replace(/{{name}}/i, name);
}

module.exports = Rules;
