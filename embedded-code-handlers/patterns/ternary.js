var helper = require('../helper.js');

module.exports = {
	name: 'Simple Branch',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['BOOLEAN'],
				['QUESTION_MARK'],
				['QUOTED_STRING', 'NUMBER'],
				['COLON'],
				['QUOTED_STRING', 'NUMBER']
			]
		)
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		if (command[index].rawValue == 'true') {
			tmpCommand.push(command[index + 2]);
		} else {
			tmpCommand.push(command[index + 4]);
		}

		for (var i = index + 5; i < command.length; i++) {
			tmpCommand.push(command[i]);
		}
		return cb(tmpCommand);
	}
};