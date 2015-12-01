var Dice = require('node-dice-js');

module.exports = function(pieces, rawEvent, bot, channelID) {
	var rollString = '';
	for (var i = 1; i < pieces.length; i++) {
		rollString += pieces[i];
	}

	var dice = new Dice();
	try {
		result = dice.execute(rollString);

		var message = '@' + rawEvent.d.author.username + ' `';

		var total = 0;
		if (result.outcomes.length > 1) {
			for (var i = 0; i < result.outcomes.length; i++) {
				total += result.outcomes[i].total;
				message += '[' + result.outcomes[i].rolls.join(', ') + ']';
				if (result.parsed.modifier) {
					message += ' + ' + result.parsed.modifier;
				}
				message += ' = ' + result.outcomes[i].total;
				if (i != result.outcomes.length - 1) {
					message += ' // ';
				}
			}
			message += ' // Grand Total: ' + total + '`';
		} else {
			message += '[' + result.outcomes[0].rolls.join(', ') + ']';
			if (result.parsed.modifier) {
				message += ' + ' + result.parsed.modifier;
			}
			message += ' = ' + result.outcomes[0].total + '`';
		}
	} catch (e) {
		var message = '`' + e.message + '`';
	}

	bot.sendMessage({
		to: channelID,
		message: message
	});
};
