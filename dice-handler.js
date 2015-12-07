var Dice = require('./dice.js');
var _ = require('lodash');


function fancyFormatting(pruned, full, diceSize) {
	if (!full) {
		var result = '[';

		for (var i = 0; i < pruned.length; i++) {
			if (i != 0) result += ', ';
			if ((pruned[i] == 1) || (pruned[i] == diceSize)) {
				result += '**' + pruned[i] + '**';
			} else {
				result += pruned[i];
			}
		}

		result += ']';
		return result;
	}

	var result = '[';

	for (var i = 0; i < full.length; i++) {
		if (i != 0) result = result + ', ';

		var index = _.indexOf(pruned, full[i]);
		if (index == -1) {
			result += '~~' + full[i] + '~~';
		} else {
			if ((full[i] == 1) || (full[i] == diceSize)) {
				result += '**' + full[i] + '**';
			} else {
				result += full[i];
			}
			pruned.splice(index, 1);
		}
	}
	result += ']';
	return result;
}

module.exports = function(pieces, stateHolder, next) {
	var startIndex = 1;
	simpleMode = false;
	plainMode = false;
	if (pieces[1] == 'simple') {
		startIndex = 2;
		simpleMode = true;
	}
	if (pieces[1] == 'plain') {
		startIndex = 2;
		simpleMode = true;
		plainMode = true;
	}
	var rollString = '';
	for (var i = startIndex; i < pieces.length; i++) {
		rollString += pieces[i];
	}

	var dice = new Dice();
	try {
		result = dice.execute(rollString);

		var message = '';
		if (!simpleMode) rollString + " = ";

		var total = 0;
		if (result.outcomes.length > 1) {
			for (var i = 0; i < result.outcomes.length; i++) {
				total += result.outcomes[i].total;
				if (!simpleMode) {
					message += fancyFormatting(result.outcomes[i].rolls, result.outcomes[i].original_rolls, result.parsed.faces);
					if (result.parsed.modifier) {
						message += ' + ' + result.parsed.modifier;
					}
					message += ' = `' + result.outcomes[i].total + '`' + "\n";
				} else {
					if (message != '') {
						message += ', ';
					}
					if (plainMode) {
						message += result.outcomes[i].total;
					} else {
						message += "`" + result.outcomes[i].total + "`";
					}
				}
			}

			stateHolder.simpleAddMessage(stateHolder.channelID, message);
		} else {
			if (!simpleMode) {
				message += result.command + " = ";
				message += fancyFormatting(result.outcomes[0].rolls, result.outcomes[0].original_rolls, result.parsed.faces)
				if (result.parsed.modifier) {
					message += ' + ' + result.parsed.modifier;
				}
				message += ' = `' + result.outcomes[0].total + '`';
			} else {
				if (plainMode) {
					message += result.outcomes[0].total;
				} else {
					message += "`" + result.outcomes[0].total + "`";
				}
			}

			if (result.parsed.extra)
				message += ' ' + result.parsed.extra;
			stateHolder.simpleAddMessage(stateHolder.channelID, message);
		}
	} catch (e) {
		var message = '`' + e.message + '`';
		stateHolder.simpleAddMessage(stateHolder.channelID, message);
	}

	next();
};
