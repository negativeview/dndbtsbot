var helper = require('../helper.js');

module.exports = {
	name: 'Equality',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['QUOTED_STRING', 'NUMBER'],
				['DOUBLE_EQUALS', 'NE', 'LTE', 'GTE', 'RIGHT_ANGLE', 'LEFT_ANGLE'],
				['QUOTED_STRING', 'NUMBER']
			]
		)
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		var argument1 = command[index + 0].rawValue;
		var argument2 = command[index + 2].rawValue;

		switch (command[index + 1].type) {
			case 'DOUBLE_EQUALS':
				if (argument1 == argument2) {
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
				break;
			case 'NE':
				if (argument1 != argument2) {
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
				break;
			case 'RIGHT_ANGLE':
				if (parseInt(argument1) > parseInt(argument2)) {
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
				break;
			case 'LEFT_ANGLE':
				if (parseInt(argument1) < parseInt(argument2)) {
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
				break;
			case 'LTE':
				if (parseInt(argument1) <= parseInt(argument2)) {
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
				break;
			case 'GTE':
				if (parseInt(argument1) >= parseInt(argument2)) {
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
				break;
		}

		for (var i = index + 3; i < command.length; i++) {
			tmpCommand.push(command[i]);
		}
		return cb(tmpCommand);
	}
};
