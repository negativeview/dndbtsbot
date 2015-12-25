var helper = require('../helper.js');
var async = require('async');

module.exports = {
	name: 'Do If Else',
	matches: function(command) {
		console.log(command);
		return helper.doesMatch(
			command,
			[
				['IF'],
				['LEFT_PAREN'],
				['BOOLEAN'],
				['RIGHT_PAREN'],
				['BLOCK'],
				['ELSE'],
				['BLOCK']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		console.log('if else');
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		if (command[index+2].rawValue == 'true') {
			execute(command[index + 4].internal, stateHolder, function() {
				for (var i = index + 7; i < command.length; i++) {
					tmpCommand.push(command[i]);
				}
				return cb(tmpCommand);
			});
		} else {
			execute(command[index + 6].internal, stateHolder, function() {
				for (var i = index + 7; i < command.length; i++) {
					tmpCommand.push(command[i]);
				}
				return cb(tmpCommand);
			});
		}
	}
};