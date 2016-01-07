var helper = require('../helper.js');
var async = require('async');

module.exports = {
	name: 'Do Foreach',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['FOREACH'],
				['LEFT_PAREN'],
				['CHANNEL', 'USER', 'SERVER', 'CHARACTER'],
				['DOT'],
				['VARIABLE'],
				['RIGHT_PAREN'],
				['BLOCK']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		command[index + 2].object.getTable(
			command[index + 4].rawValue,
			function(result) {
				async.eachSeries(
					result,
					function(iterator, callback) {
						state.variables.key   = iterator.key;
						state.variables.value = iterator.value;

						execute(command[index + 6].internal, state, function() {
							callback();
						});
					},
					function() {
						for (var i = index + 7; i < command.length; i++) {
							tmpCommand.push(command[i]);
						}
						return cb(tmpCommand);
					}
				);
			}
		);
	}
};