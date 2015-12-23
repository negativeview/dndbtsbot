var helper = require('../helper.js');

module.exports = {
	name: 'Ignore something',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['IGNORE'],
				['QUOTED_STRING', 'NUMBER'],
				['SEMICOLON']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		return cb([]);
	}
};