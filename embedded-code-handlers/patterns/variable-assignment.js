module.exports = {
	name: 'Variable Assignment',
	matches: function(command) {
		if (command.length != 5 && command.length != 4) return false;
		if (command.length == 5 && command[0].type != 'VAR') return false;

		var offset = 0;
		if (command.length == 5) offset = 1;

		if (command[offset + 0].type != 'VARIABLE') return false;
		if (command[offset + 1].type != 'EQUALS') return false;
		if (command[offset + 2].type != 'QUOTED_STRING' && command[offset + 2].type != 'NUMBER' && command[offset + 2].type != 'VARIABLE') return false;
		if (command[offset + 3].type != 'SEMICOLON') return false;

		return offset;
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		state.variables[command[index + 0].rawValue] =
			command[index + 2].type == 'VARIABLE' ?
				(
					state.blockVariables[command[index + 2].rawValue] ?
						state.blockVariables[command[index + 2].rawValue] :
						state.variables[command[index + 2].rawValue]
				) :
				command[index + 2].rawValue;

		return cb([]);
	}
};