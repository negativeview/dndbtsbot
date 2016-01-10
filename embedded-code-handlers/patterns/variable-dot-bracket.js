var helper = require('../helper.js');

module.exports = {
	name: 'Variable Dot Bracket',
	matches: function(command) {
		var index = helper.doesMatch(
			command,
			[
				['SERVER', 'CHANNEL', 'USER', 'CHARACTER'],
				['DOT'],
				['VARIABLE'],
				['LEFT_BRACKET']
			]
		);
		return index;
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		tmpCommand.push({
			type: 'TABLE',
			namespace: command[index].rawValue,
			name: command[index+2].rawValue,
			rawValue: command[index].rawValue + '.' + command[index+2].rawValue
		});

		for (var i = index + 3; i < command.length; i++) {
			tmpCommand.push(command[i]);
		}
		return cb(tmpCommand);
	}
};