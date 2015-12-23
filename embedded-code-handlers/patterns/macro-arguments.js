var helper = require('../helper.js');

module.exports = {
	name: 'Macro arguments',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['LEFT_CURLY'],
				['NUMBER', 'STRING'],
				['RIGHT_CURLY']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}
		tmpCommand.push({
			type: 'QUOTED_STRING',
			rawValue: state.args[command[index+1].rawValue]
		});
		for (var i = index + 3; i < command.length; i++) {
			tmpCommand.push(command[i]);
		}
		return cb(tmpCommand);
	}
};
