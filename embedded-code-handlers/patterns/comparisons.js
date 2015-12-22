var helper = require('../helper.js');

module.exports = {
	name: 'LE, GE, NE',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['LEFT_ANGLE', 'RIGHT_ANGLE', 'EXCLAMATION'],
				['EQUALS']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, cb) {
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		switch (command[index].type) {
			case 'LEFT_ANGLE':
				tmpCommand.push({
					type: 'LTE',
					rawValue: '<='
				});
				break;
			case 'RIGHT_ANGLE':
				tmpCommand.push({
					type: 'GTE',
					rawValue: '>='
				});
				break;
			case 'EXCLAMATION':
				tmpCommand.push({
					type: 'NE',
					rawValue: '!='
				});
				break;
		}
		for (var i = index + 2; i < command.length; i++) {
			tmpCommand.push(command[i]);
		}

		return cb(tmpCommand);
	}
};
