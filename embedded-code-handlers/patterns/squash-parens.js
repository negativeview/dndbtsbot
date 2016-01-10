var helper = require('../helper.js');

module.exports = {
	name: 'Squash parens',
	matches: function(command) {
		var res = helper.doesMatch(
			command,
			[
				['LEFT_PAREN'],
				['CHANNEL_VARIABLE', 'QUOTED_STRING', 'BOOLEAN'],
				['RIGHT_PAREN']
			]
		);
		return res;
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		tmpCommand.push(command[index + 1]);
		
		for (var i = index + 3; i < command.length; i++) {
			tmpCommand.push(command[i]);
		}
		return cb(tmpCommand);
	}
};