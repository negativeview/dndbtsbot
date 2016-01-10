var helper = require('../helper.js');

module.exports = {
	name: 'Variable Assignment',
	matches: function(command) {
		var matched = helper.doesMatch(
			command,
			[
				['VARIABLE'],
				['EQUALS'],
				['QUOTED_STRING', 'VARIABLE'],
				['SEMICOLON']
			]
		);
		return matched;
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		state.variables[command[index + 0].rawValue] =
			command[index + 2].type == 'VARIABLE' ?
				(
					state.variables[command[index + 2].rawValue] ?
						state.variables[command[index + 2].rawValue] :
						state.variables[command[index + 2].rawValue]
				) :
				command[index + 2].rawValue;

		return cb([]);
	}
};