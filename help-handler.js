var moment = require('moment-timezone');

module.exports = function(pieces, message, rawEvent, bot, channelID, globalHandler) {
	var message = "Commands:\n\n!roll:\n\t`!roll 2d20` roll two 20-sided dice.\n\t`!roll 2d20-H` roll a d20 with DND 5e 'advantage'\n\t`!roll 2d20-L` roll a d20 with DND 5e 'disadvantage'\n\t`!roll 1d20+6` roll a d20 and add 6\n\t`!roll 2d20-H+6` roll a d20 with advantage and adding 6\nMacros:\n\t`!setmacro <name> <command>`\n\t\tExample: `!setmacro Initiative roll 1d20+5` would allow you to type !Initiative to roll your initiative.\n\t`!viewmacro`\n\t\tPMs you a list of your macros.\n\t`!removemacro <macroname>`\n\t\tRemoves a macro you had set.\n\nSource code can be found at https://github.com/negativeview/dndbtsbot";

	bot.sendMessage({
		to: rawEvent.d.author.id,
		message: message
	});
};
