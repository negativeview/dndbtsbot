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

		var matches = command[index].rawValue.match(/\{([0-9]*)\}/);

		if (matches.length) {
			tmpCommand.push({
				type: 'QUOTED_STRING',
				rawValue: state.args[matches[1]]
			});
		} else {
			tmpCommand.push({
				type: 'QUOTED_STRING',
				rawValue: ''
			});			
		}
		for (var i = index + 1; i < command.length; i++) {
			tmpCommand.push(command[i]);
		}
		return cb(tmpCommand);
	}
};
