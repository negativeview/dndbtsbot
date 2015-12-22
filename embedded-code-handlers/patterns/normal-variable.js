var helper = require('../helper.js');

module.exports = {
	name: 'Normal variable',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['VARIABLE']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, cb) {
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		tmpCommand.push(
			{
				type: 'QUOTED_STRING',
				rawValue: state.variables[command[index].rawValue]
			}
		);
		
		for (var i = index + 1; i < command.length; i++) {
			tmpCommand.push(command[i]);
		}
		return cb(tmpCommand);
	}
};
