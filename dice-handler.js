var Dice = require('./dice.js');
var _ = require('lodash');


function fancyFormatting(pruned, full) {
	if (!full)
		return '[' + pruned.join(', ') + ']';

	var result = '[';

	for (var i = 0; i < full.length; i++) {
		if (i != 0) result = result + ', ';

		var index = _.indexOf(pruned, full[i]);
		if (index == -1) {
			result += '~~' + full[i] + '~~';
		} else {
			result += full[i];
			pruned.splice(index, 1);
		}
	}
	result += ']';
	return result;
}

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
				message += fancyFormatting(result.outcomes[i].rolls, result.outcomes[i].original_rolls);
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
			message += fancyFormatting(result.outcomes[0].rolls, result.outcomes[0].original_rolls)
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
