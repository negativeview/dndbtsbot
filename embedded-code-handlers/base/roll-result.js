function RollResult(rollResult) {
	this.command = rollResult.command;
	this.output = rollResult.output;
	this.totalResult = rollResult.totalResult;

	var dieIndex = 0;
	for (var i = 0; i < rollResult.rawResults.length; i++) {
		var rawResult = rollResult.rawResults[i];
		if (rawResult.type == 'die') {
			for (var m = 0; m < rawResult.results.length; m++) {
				this['die' + dieIndex] = rawResult.results[m];
				dieIndex++;
			}
		}
	}

	this.type = 'ROLL_RESULT';
}

module.exports = RollResult;