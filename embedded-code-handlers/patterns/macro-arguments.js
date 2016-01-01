var helper = require('../helper.js');

module.exports = {
	name: 'Macro arguments',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['MACRO_ARGUMENT']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		var matches = command[index].rawValue.match(/\{([0-9]*)(\+?)\}/);
		var args = state.args ? state.args : state.originalArgs;
		var stringValue = '';

		if (matches.length == 3) {
			if (matches[2] == '+') {
				var startingIndex = parseInt(matches[1]);

				for (var i = startingIndex; i < args.length; i++) {
					if (i != startingIndex) {
						stringValue += ' ';
					}
					stringValue += args[i];
				}
			} else {
				if (args) {
					stringValue = args[matches[1]];
				}
			}
		}
		tmpCommand.push({
			type: 'QUOTED_STRING',
			rawValue: stringValue
		});

		for (var i = index + 1; i < command.length; i++) {
			tmpCommand.push(command[i]);
		}
		return cb(tmpCommand);
	}
};
