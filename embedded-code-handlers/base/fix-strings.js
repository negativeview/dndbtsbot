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
		if (token.type == 'DOUBLE_QUOTE') {
			var newString = '';
			for (var i = 1; i < token.stringValue.length - 1; i++) {
				newString += token.stringValue[i];
			}

			var token = {
				rawValue: newString,
				stringValue: newString,
				type: 'QUOTED_STRING'
			};
		}
		workingCommand.push(token);
	}

	return callback(null, workingCommand);
}