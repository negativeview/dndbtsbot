var helper = require('../helper.js');
var async = require('async');

module.exports = {
	name: 'Do If',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['IF'],
				['LEFT_PAREN'],
				['BOOLEAN'],
				['RIGHT_PAREN'],
				['BLOCK']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		console.log('do if');
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		if (command[index+2].rawValue == 'true') {
			execute(command[index + 4].internal, stateHolder, function() {
				for (var i = index + 5; i < command.length; i++) {
					tmpCommand.push(command[i]);
				}
				return cb(tmpCommand);
			});
		} else {
			for (var i = index + 5; i < command.length; i++) {
				tmpCommand.push(command[i]);
			}
			return cb(tmpCommand);			
		}
	}
};