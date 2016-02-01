/**
 * This file turns strings and string-like things into QUOTED_STRING tokens.
 */

module.exports = function(command, callback) {
	var workingCommand = [];
	var inString = false;
	var workingString = '';
	var stringType = null;
	for (var m = 0; m < command.length; m++) {
		var token = command[m];
		if (!inString) {
			if (token.type == 'SINGLE_QUOTE') {
				inString = true;
				stringType = 'SINGLE_QUOTE';
			} else if (token.type == 'DOUBLE_QUOTE') {
				inString = true;
				stringType = 'DOUBLE_QUOTE';
			} else {
				workingCommand.push(token);
			}
		} else {
			if (token.type == stringType) {
				stringType = null;
				inString = false;
				token = {
					type: 'QUOTED_STRING',
					stringValue: '"' + workingString + '"',
					rawValue: workingString
				};
				workingString = '';
				workingCommand.push(token);
			} else {
				workingString += token.rawValue;
			}
		}
	}

	if (inString) {
		var erroredLine = '';
		for (var i = 0; i < command.length; i++) {
			if (i != 0) erroredLine += ' ';
			erroredLine += command[i].rawValue;
		}
		throw new Error("Missing closing " + stringType + " in line `" + erroredLine + "`");
	}
	return callback(null, workingCommand);
}