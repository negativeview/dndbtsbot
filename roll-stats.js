var Dice = require('./dice.js');

var ret = {

};

ret.init = function(diceHandler) {
	ret.diceHandler = diceHandler;
}

ret.roll = function(pieces, stateHolder, next) {
	stateHolder.simpleAddMessage(stateHolder.channelID, "\n");
	ret.diceHandler(['!roll', '4d6kh3'], stateHolder, function() {
		stateHolder.simpleAddMessage(stateHolder.channelID, "\n");
		ret.diceHandler(['!roll', '4d6kh3'], stateHolder, function() {
			stateHolder.simpleAddMessage(stateHolder.channelID, "\n");
			ret.diceHandler(['!roll', '4d6kh3'], stateHolder, function() {
				stateHolder.simpleAddMessage(stateHolder.channelID, "\n");
				ret.diceHandler(['!roll', '4d6kh3'], stateHolder, function() {
					stateHolder.simpleAddMessage(stateHolder.channelID, "\n");
					ret.diceHandler(['!roll', '4d6kh3'], stateHolder, function() {
						stateHolder.simpleAddMessage(stateHolder.channelID, "\n");
						ret.diceHandler(['!roll', '4d6kh3'], stateHolder, function() {
							next();
						});
					});
				});
			});
		});
	})
}

module.exports = ret;