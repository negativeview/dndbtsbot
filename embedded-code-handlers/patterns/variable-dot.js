var helper = require('../helper.js');

module.exports = {
	name: 'Variable Dot',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['SERVER', 'CHANNEL', 'USER', 'CHARACTER'],
				['DOT'],
				['VARIABLE']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, cb) {
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		console.log(command[index]);
		command[index].object.getSub(command[index + 2].rawValue, function(result) {
			tmpCommand.push({
				type: 'QUOTED_STRING',
				rawValue: result
			});
			
			for (var i = index + 3; i < command.length; i++) {
				tmpCommand.push(command[i]);
			}
			return cb(tmpCommand);
		});
	}
};