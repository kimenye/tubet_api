var mongoose = require('mongoose');
var replies = require('../../behaviours/replies.js');
var Bet = require('./bet.js');
var moment = require('moment');
var notify = require('../../util/notification.js');
var Schema = mongoose.Schema;

var gameSchema = new Schema({
  matchCode: String,
  gameId: String,
  homeTeam: String,
  awayTeam: String,
  homeOdds: Number,
  awayOdds: Number,
  drawOdds: Number,
  hashTag: String,
  bothScoreYesOdds: Number,
  bothScoreNoOdds: Number,
  overOdds: Number,
  underOdds: Number,
  minute: String,
  status: String,
  result: String,
  date: Date,
  tracker: String,
  betable: Boolean,
  featured: Boolean,
  liveCommentary: Boolean,
  promo: String,
  promoUrl: String
});

gameSchema.methods.asOption = function() {
  return replies.teams[this.homeTeam]['short'] + "-" + replies.teams[this.awayTeam]['short'];
}

gameSchema.methods.getBetTypes = function() {
  return {
    'h': this.homeOdds,
    'a': this.awayOdds,
    'x': this.drawOdds,
    'gg': this.bothScoreYesOdds,
    'ng': this.bothScoreNoOdds,
    'o': this.overOdds,
    'u': this.underOdds
  }
}

gameSchema.methods.getBetOption = function(text) {
  txt = text.toLowerCase();
  if (txt == replies.teams[this.homeTeam]['full'].toLowerCase())
    return 'h';
  else if (txt == replies.teams[this.awayTeam]['full'].toLowerCase())
    return 'a';
  else if (txt == "draw")
    return 'x';
  else if (txt == "gg")
    return 'gg';
  else if (txt == "ng")
    return 'ng';
  else if (txt == "ov25")
    return 'o';
  else if (txt == "un25")
    return 'u';
  else
    return null;
}

gameSchema.methods.notifyPunters = function(type, score, message, beta) {

  console.log("About to notify punters", type, score, message, beta);

  var self = this;
  return new Promise(function(resolve, reject) {
    Bet.find({ gameId: self.gameId, state: 'live' }, function(err, bets) {
      playerIds = bets.map(function(bet) { return bet.playerId });
      console.log("Notifying", playerIds);
      notify.sendToMany(playerIds, message, null, null,beta, null);
    })
  });
}

gameSchema.methods.score = function() {
  if (this.result)
    return this.result;
  else
    return '0-0';
}

gameSchema.methods.progress = function() {
  var str = "*" + replies.teams[this.homeTeam]['full'] + " vs " + replies.teams[this.awayTeam]['full'] + "*\r\n";

  status = this.status;
  var time = this.minute;
  if (!time)
    time = '';

  if (status == 'live') {
    str += "_In progress: " + time + "_";
  }
  else if (status == 'pending') {
    str += moment(this.date).format('llll');
  }
  else if (status == 'complete') {
    str += "_Complete_";
  }
  str += "\r\n_Score: " + this.score() + "_";
  return str;
}

gameSchema.methods.getPossibleWinnings = function(betOption,amount) {
  switch (betOption) {
    case 'h':
      return Math.ceil(this.homeOdds * amount);
      break;
    case 'a':
      return Math.ceil(this.awayOdds * amount);
      break;
    case 'gg':
      return Math.ceil(this.bothScoreYesOdds * amount);
      break;
    case 'ng':
      return Math.ceil(this.bothScoreNoOdds * amount);
      break;
    case 'o':
      return Math.ceil(this.overOdds * amount);
      break;
    case 'u':
      return Math.ceil(this.underOdds * amount);
      break;
    default:
      return Math.ceil(this.drawOdds * amount);
  }
}

gameSchema.methods.getBetOutcome = function(betOption) {
  switch (betOption) {
    case 'h':
      return replies.teams[this.homeTeam]['full'] + " win";
      break;
    case 'a':
      return replies.teams[this.awayTeam]['full'] + " win";
      break;
    case 'gg':
      return replies.texts.betOptionGG;
      break;
    case 'ng':
      return replies.texts.betOptionNG;
      break;
    case 'o':
      return replies.texts.betOptionOV;
      break;
    case 'u':
      return replies.texts.betOptionUN;
      break;
    default:
      return "Draw";
  }
}

gameSchema.methods.title = function() {
  return "*" + replies.teams[this.homeTeam]['full'] + " vs " + replies.teams[this.awayTeam]['full'] + "*";
}

gameSchema.methods.asBet = function(player) {
  var str = "*" + replies.teams[this.homeTeam]['full'] + " vs " + replies.teams[this.awayTeam]['full'] + "*";
  str += "\r\n" + moment(this.date).format("ll HH:mm") + "\r\n";
  if (this.featured && this.promo) {
    str += "\r\n\r\n";
    str += this.promo;
    str += "\r\n";
  }

  str += "\r\n";
  str += replies.teams[this.homeTeam]['full'] + " Win - (" + this.homeOdds + ")\r\n";
  str += replies.teams[this.awayTeam]['full'] + " Win - (" + this.awayOdds + ")\r\n";
  str += "Draw - (" + this.drawOdds + ")\r\n";
  // need to customize for betting
  switch (player.level) {
    case "1":
    case "2":
      if (this.bothScoreYesOdds)
        str += "Both teams to score GG - (" + this.bothScoreYesOdds + ")";

      if (this.bothScoreNoOdds)
        str += "\r\nNo goals NG - (" + this.bothScoreNoOdds + ")";

      if (this.overOdds)
        str += "\r\n3 or more goals scored OV25 - (" + this.overOdds + ")";

      if (this.underOdds)
        str += "\r\nLess than 3 goals scored UN25 - (" + this.underOdds + ")";
      break;
  }
  return str;
}

gameSchema.methods.betOptions = function(player) {
  switch (player.level) {
    case "1":
    case "2":
      return replies.teams[this.homeTeam]['full'] + ",Draw," + replies.teams[this.awayTeam]['full'] + ",GG,NG,OV25,UN25";
      break;
    default:
      return replies.teams[this.homeTeam]['full'] + ",Draw," + replies.teams[this.awayTeam]['full'];
  }
}

module.exports = mongoose.model('Game', gameSchema);
