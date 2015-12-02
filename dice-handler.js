var Dice = require('./dice.js');

module.exports = function(pieces, message, rawEvent, bot, channelID, globalHandler) {
	var rollString = '';
	for (var i = 1; i < pieces.length; i++) {
		rollString += pieces[i];
	}

	var dice = new Dice();
	try {
		result = dice.execute(rollString);

		var message = '@' + rawEvent.d.author.username + ' ' + rollString + "\n";

		var total = 0;
		if (result.outcomes.length > 1) {
			for (var i = 0; i < result.outcomes.length; i++) {
				total += result.outcomes[i].total;
				message += '[' + result.outcomes[i].rolls.join(', ') + ']';
				if (result.parsed.modifier) {
					message += ' + ' + result.parsed.modifier;
				}
				message += ' = `' + result.outcomes[i].total + '`' + "\n";
			}
			message += 'Grand Total: `' + total + '`';
			bot.sendMessage({
				to: channelID,
				message: message
			});
		} else {
			message += '[' + result.outcomes[0].rolls.join(', ') + ']';
			if (result.parsed.modifier) {
				message += ' + ' + result.parsed.modifier;
			}
			message += ' = `' + result.outcomes[0].total + '`';
			bot.sendMessage({
				to: channelID,
				message: message
			});
		}
	} catch (e) {
		var message = '`' + e.message + '`';
		bot.sendMessage({
			to: channelID,
			message: message
		});
	}
};
