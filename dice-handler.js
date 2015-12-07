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
	dice.execute(rollString, function(result) {
		var message = '';
		if (!simpleMode) rollString + " = ";

		var total = 0;
		stateHolder.simpleAddMessage(stateHolder.channelID, result.output);

		next();
	});
};
