var Dice = require('./dice.js');
var _ = require('lodash');

var ret = {

};

ret.init = function(diceHandler) {
	ret.diceHandler = diceHandler;
}

ret.roll = function(pieces, message, rawEvent, channelID, globalHandler, stateHolder, next) {
	var fakePieces = [
		'!roll',
		'(4d6(kh3))x6'
	];
	ret.diceHandler(fakePieces, message, rawEvent, channelID, globalHandler, stateHolder, next);
}

module.exports = ret;