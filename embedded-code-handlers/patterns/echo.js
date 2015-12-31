var helper = require('../helper.js');

module.exports = {
	name: 'Echo something',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['ECHO'],
				['QUOTED_STRING', 'NUMBER', 'BOOLEAN'],
				['SEMICOLON']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		var holder = stateHolder.real ? stateHolder.real : stateHolder;

		holder.simpleAddMessage(
			holder.channelID,
			command[1].rawValue
		);
		return cb([]);
	}
};