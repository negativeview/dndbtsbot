var ret = {
	init: function(diceHandler) {
		ret.diceHandler = diceHandler;
	},
	normal: function(pieces, stateHolder, next) {
		if (pieces.length < 3) {
			stateHolder.simpleAddMessage(stateHolder.username, "`" + pieces[0] + " <modifier> <description>`");
			return next();
		}

		var statement = '';
		for (var i = 2; i < pieces.length; i++) {
			if (i != 2) statement += ' ';
			statement += pieces[i];
		}

		stateHolder.simpleAddMessage(stateHolder.channelID, "\n");
		stateHolder.simpleAddMessage(stateHolder.channelID, "**" + statement + "**: ");
		ret.diceHandler(['!roll', '1d20+' + pieces[1]], stateHolder, next);
	},
	advantage: function(pieces, stateHolder, next) {
		if (pieces.length < 3) {
			stateHolder.simpleAddMessage(stateHolder.username, "`" + pieces[0] + " <modifier> <description>`");
			return next();
		}
		
		var statement = '';
		for (var i = 2; i < pieces.length; i++) {
			if (i != 2) statement += ' ';
			statement += pieces[i];
		}

		stateHolder.simpleAddMessage(stateHolder.channelID, "\n");
		stateHolder.simpleAddMessage(stateHolder.channelID, "**" + statement + "**: ");
		ret.diceHandler(['!roll', '2d20-H+' + pieces[1]], stateHolder, next);
	},
	disadvantage: function(pieces, stateHolder, next) {
		if (pieces.length < 3) {
			stateHolder.simpleAddMessage(stateHolder.username, "`" + pieces[0] + " <modifier> <description>`");
			return next();
		}
		
		var statement = '';
		for (var i = 2; i < pieces.length; i++) {
			if (i != 2) statement += ' ';
			statement += pieces[i];
		}

		stateHolder.simpleAddMessage(stateHolder.channelID, "\n");
		stateHolder.simpleAddMessage(stateHolder.channelID, "**" + statement + "**: ");
		ret.diceHandler(['!roll', '2d20-L+' + pieces[1]], stateHolder, next);
	}
};

module.exports = ret;