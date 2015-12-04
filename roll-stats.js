var Dice = require('./dice.js');
var _ = require('lodash');

var ret = {

};

ret.init = function(diceHandler) {
	ret.diceHandler = diceHandler;
}

ret.roll = function(pieces, message, rawEvent, channelID, globalHandler, stateHolder, next) {
	var fakePieces = [];
	if (pieces.length > 1 && pieces[1].indexOf("simple") === 0) {
		fakePieces = [
			'!roll',
			'simple',
			'(4d6(kh3))x6'
		];
	} else {
		fakePieces = [
			'!roll',
			'(4d6(kh3))x6'
		];
	}
	ret.diceHandler(fakePieces, message, rawEvent, channelID, globalHandler, stateHolder, next);
}

module.exports = ret;