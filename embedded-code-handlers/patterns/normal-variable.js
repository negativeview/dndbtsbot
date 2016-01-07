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
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		var variableName = command[index].rawValue;
		var variableValue = '';

		if (state.variables && state.variables[variableName]) {
			variableValue = state.variables[variableName];
		} else {
			if (state.variables && state.variables[variableName]) {
				variableValue = state.variables[variableName];
			} else {
				console.log('Could not find variable ' + variableName, state);
				stateHolder.real.errorList.push(variableName + ' looks like a variable, but does not seem to be defined.');
				variableValue = '';
			}
		}

		tmpCommand.push(
			{
				type: 'QUOTED_STRING',
				rawValue: variableValue
			}
		);
		
		for (var i = index + 1; i < command.length; i++) {
			tmpCommand.push(command[i]);
		}
		return cb(tmpCommand);
	}
};
