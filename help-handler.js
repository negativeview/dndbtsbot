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
		"`!help weapons` - Get help on weapons that your character can use.\n";
		//"`!help links` - A collection of links that would be useful to understanding the bot.\n" +
		//"`!help programming` - Want to program the bot?";

	if (pieces.length == 1) {
		stateHolder.simpleAddMessage(stateHolder.username, message);
		return next();
	}

	switch(pieces[1]) {
		case 'dice':
			message =
				"The dice commands closely mirror dice commands on roll20, except that you start with `!roll` or `!r` instead of `/roll`\n" +
				"Here are some examples:\n\n" +
				"`!r 2d20 + 3`\n`!r 2d20-H + 3` (rolling with advantage)\n`!r 2d20-L + 3` (rolling with disadvantage)\n\n" +
				"You can also do a couple of special types of rolls:\n" +
				"`!rollstats` (roll 4d6, drop the lowest, six times)\n" +
				"`!2 7 acrobatics` (roll 1d20 + 7, and label it as \"acrobatics\")\n" +
				"`!2a 7 acrobatics` (as above, but with advantage)\n" +
				"`!2d 7 acrobatics` (as above, but with disadvantage)";
			break;
		case 'character':
			message =
				"To create a character, first issue the following command:\n\n" +
				"`!character create <character name>`\n\n" +
				"Now we set this character as our active character:\n\n" +
				"`!character current <character name>`\n\n" +
				"Now we need to set our ability scores:\n\n" +
				"`!character set strength 16` (and so on)\n\n" +
				"Now we set our proficiencies:\n\n" +
				"`!character proficiency acrobatics 1` (normal proficiency)\n" +
				"`!character proficiency acrobatics 2` (double proficiency)\n" +
				"`!character proficiency acrobatics 0` (removing a proficiency)\n\n" +
				"At any time use the following to see what your character looks like so far:\n\n" +
				"`!character view <character name>`\n\n" +
				"To add weapons, see `!help weapons`";
			break;
		case 'weapons':
			message =
				"To see what weapons are available:\n\n" +
				"`!weaponstore list`\n\n" +
				"To grab a weapon for your character:\n\n" +
				"`!character weapon grab <weapon name>`\n\n" +
				"To see what the weapon looks like on your character:\n\n" +
				"`!character view <character name>`\n\n" +
				"To modify the weapon to your liking:\n\n" +
				"`!character weapon set <property name> <value>`\n\n";
			break;
		case 'links':
			break;
		case 'programming':
			break;
	}

	stateHolder.simpleAddMessage(stateHolder.username, message);
	return next();
};

module.exports = ret;