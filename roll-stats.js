var Dice = require('./dice.js');
var _ = require('lodash');

var ret = {

};

ret.init = function(diceHandler) {
	ret.diceHandler = diceHandler;
}

ret.roll = function(pieces, stateHolder, next) {
	for (var i = 0; i < 6; i++) {
		stateHolder.block.addStatement('!roll 4d6kh3');
		if (i != 5)
			stateHolder.block.addStatement('!echon');
	}
	return next();
}

module.exports = ret;