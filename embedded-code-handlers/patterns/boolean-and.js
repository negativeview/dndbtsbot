var helper = require('../helper.js');

module.exports = {
	name: 'Boolean And',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['BOOLEAN'],
				['BOOLEAN_AND'],
				['BOOLEAN']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		if (command[index].rawValue == 'true' && command[index + 2].rawValue == 'true') {
			tmpCommand.push({
				type: 'BOOLEAN',
				rawValue: 'true'
			});
		} else {
			tmpCommand.push({
				type: 'BOOLEAN',
				rawValue: 'false'
			});
		}

		for (var i = index + 3; i < command.length; i++) {
			tmpCommand.push(command[i]);
		}

		return cb(tmpCommand);
	}
};
