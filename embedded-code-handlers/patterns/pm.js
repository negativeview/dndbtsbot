var helper = require('../helper.js');

module.exports = {
	name: 'PM something',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['PM'],
				['QUOTED_STRING'],
				['SEMICOLON']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		var holder = stateHolder.real ? stateHolder.real : stateHolder;

		holder.simpleAddMessage(
			holder.username,
			command[1].rawValue
		);
		return cb([]);
	}
};