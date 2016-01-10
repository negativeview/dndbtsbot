var helper = require('../helper.js');

module.exports = {
	name: 'Variable Dot Equals',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['SERVER', 'CHANNEL', 'USER', 'CHARACTER'],
				['DOT'],
				['VARIABLE'],
				['EQUALS'],
				['QUOTED_STRING'],
				['SEMICOLON']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		command[index].object.putSub(
			command[index + 2].rawValue,
			command[index + 4].rawValue,
			function(result) {
				return cb('');
			}
		);
	}
};