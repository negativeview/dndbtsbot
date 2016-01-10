var helper = require('../helper.js');

module.exports = {
	name: 'Table lookup',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['VARIABLE'],
				['LEFT_BRACKET'],
				['QUOTED_STRING'],
				['RIGHT_BRACKET']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		tmpCommand.push({
			type: 'TABLE',
			namespace: 'user',
			name: command[index+2].rawValue,
			rawValue: 'me.' + command[index+2].rawValue
		});

		for (var i = index + 4; i < command.length; i++) {
			tmpCommand.push(command[i]);
		}
		return cb(tmpCommand);
	}
};