var moment = require('moment-timezone');

var ret = {
};

ret.init = function(mongoose) {
	ret.mongoose = mongoose;
}

ret.run = function(pieces, stateHolder, next) {
	var message =
		"The bot has grown so complex that it doesn't fit in a single help message. " +
		"Here are some commands you can run to get help about specific things:\n" +
		"\n" +
		"`!help dice` - Get help on how to roll dice.\n" +
		"`!help character` - Get help on the built-in character sheet.\n" +
		"`!help weapons` - Get help on weapons that your character can use.\n" +
		"`!help links` - A collection of links that would be useful to understanding the bot.\n" +
		"`!help programming` - Want to program the bot?";

	if (pieces.length == 1) {
		stateHolder.simpleAddMessage(stateHolder.username, message);
		return next();
	}

	switch(pieces[1]) {
		case 'dice':
			break;
		case 'character':
			break;
		case 'weapons':
			/*
				!weaponstore list
				!weaponstore add <shortname> <optional longer name>
				!weaponstore set <short weapon name> <key> <value>
			*/
			break;
		case 'links':
			break;
		case 'programming':
			break;
	}

	stateHolder.simpleAddMessage(stateHolder.username, message);
};

module.exports = ret;