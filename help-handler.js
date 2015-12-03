var moment = require('moment-timezone');

var ret = {
};

ret.init = function(mongoose) {
	ret.mongoose = mongoose;
}

ret.run = function(pieces, message, rawEvent, bot, channelID, globalHandler) {
	var message = "Commands:\n\n!roll / !r:\n\t`!r 2d20` roll two 20-sided dice.\n\t`!r 2d20-H` roll a d20 with DND 5e 'advantage'\n\t`!r 2d20-L` roll a d20 with DND 5e 'disadvantage'\n\t`!r 1d20+6` roll a d20 and add 6\n\t`!r 2d20-H+6` roll a d20 with advantage and adding 6\n\t`!r (4d6(kh3))` roll 4 d6 and keep the highest 3\nMacros:\n\t`!setmacro <name> <command>`\n\t\tExample: `!setmacro Initiative roll 1d20+5` would allow you to type !Initiative to roll your initiative.\n\t`!viewmacro`\n\t\tPMs you a list of your macros.\n\t`!removemacro <macroname>`\n\t\tRemoves a macro you had set.\n!rollstats\n\t`!rollstats` rolls 4 d6, keeping the highest 3 and does this six times.\n!echo\n\t`!echo Yo` Says Yo. Mostly useful for macros.\n\nSource code can be found at https://github.com/negativeview/dndbtsbot";

	bot.sendMessage({
		to: rawEvent.d.author.id,
		message: message
	});

	var serverID = null;
	for (var i in bot.servers) {
		for (var m in bot.servers[i].channels) {
			if (bot.servers[i].channels[m].id == channelID) {
				serverID = bot.servers[i].id;
				break;
			}
		}
		if (serverID) break;
	}

	if (serverID) {
		macroModel = ret.mongoose.model('AdminMacro');
		macroModel.find({server: serverID}).exec(function(err, res) {
			if (res.length) {
				var message = "**Commands set by your Admin**:";
				for (var i = 0; i < res.length; i++) {
					message += "\n\t`" + res[i].name + "`";
				}
				bot.sendMessage({
					to: rawEvent.d.author.id,
					message: message
				});
			}
		});
	}
};

module.exports = ret;