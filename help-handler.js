var moment = require('moment-timezone');

var ret = {
};

ret.init = function(mongoose) {
	ret.mongoose = mongoose;
}

ret.run = function(pieces, stateHolder, next) {
	var message =
		"Commands:\n\n" +
		"Dice:\n" +
		"\t`!r 2d20` - roll two 20-sided dice.\n" +
		"\t`!r 2d20-H` - roll a d20 with DND 5e 'advantage'\n" +
		"\t`!r 2d20-L` - roll a d20 with DND 5e 'disadvantage'\n" +
		"\t`!r 1d20+6` - roll a d20 and add 6\n" +
		"\t`!r 2d20-H+6` - roll a d20 with advantage and adding 6\n" +
		"\t`!r (4d6(kh3))` - roll 4 d6 and keep the highest 3\n" +
		"\t`!r simple 2d20` - Suppress the math used to get to the result.\n" +
		"\t`!r plain 2d20` - Show only the result with no styling.\n" +
		"\t`!rollstats` - rolls 4 d6, keeping the highest 3 and does this six times.\n" +
		"Macros:\n" +
		"\t`!macro get` - Show your macros\n" +
		"\t`!macro set <name> <command>` - Set a new macro\n" +
		"\t`!macro delete <name>` - Remove a macro\n" +
		"\t`!macro admin get` - Show global macros\n" +
		"\t`!macro admin set <name> <command>` - Set a new global macro\n" +
		"\t`!macro admin delete <name>` - Remove a global macro\n" +
		"Echoing\n" +
		"\t`!echo Yo` - Says Yo. Mostly useful for macros.\n" +
		"\t`!echon` - Echoes a new line. Mostly useful for macros.\n" +
		"\t`!pm` - PMs a thing to you. Mostly useful for macros.\n" +
		"Variables\n" +
		"\t`var set me strength 3` - Sets a variable on yourself that can be used for other things.\n" +
		"\t`var get me strength` - Echos a variable you have set previously.\n" +
		"Tables\n" +
		"\t`!table create me <tablename>` - Create a table.\n" +
		"\t`!table set me <tablename> <key> <value>` - Set a value in a table.\n" +
		"\t`!table get me <tablename> <key>` - Get a value from a table.\n" +
		"\t`!table random me <tablename>` - Get a random value from a table.\n" +
		"Characters\n" +
		"\t`!character create <name>` - Create a character.\n" +
		"\t`!character view <name>` - View character.\n" +
		"\t`!character current <name>` - Set a certain character as your active character.\n" +
		"\t`!character set <key> <value>` - Sets a value on your current character.\n" +
		"\t`!character delete <name>` - Deletes a character.\n" +
		"\t`!character weapon create <ability score> <damage die size> <damage type> <name>` - Create a weapon for your current character.\n" +
		"\t\t`!character weapon create strength 4 piercing Dagger` - Creates a strength-based dagger.\n" +
		"\t`!character weapon drop <name>` - Completely drops a weapon from your active character.\n" +
		"**Note** that multiple commands can be put into a single message. This is how you do crazy stuff.\n\n" +
		"Source code can be found at https://github.com/negativeview/dndbtsbot";

	stateHolder.simpleAddMessage(stateHolder.username, message);

	var serverID = null;
	for (var i in stateHolder.bot.servers) {
		for (var m in stateHolder.bot.servers[i].channels) {
			if (stateHolder.bot.servers[i].channels[m].id == stateHolder.channelID) {
				serverID = stateHolder.bot.servers[i].id;
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
				stateHolder.simpleAddMessage(stateHolder.username, message);
			}
			next();
		});
	} else {
		next();
	}
};

module.exports = ret;