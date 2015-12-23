var helper = require('../helper.js');

module.exports = {
	name: 'Table lookup',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['VARIABLE'],
				['LEFT_BRACKET'],
				['QUOTED_STRING', 'NUMBER'],
				['RIGHT_BRACKET']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		var key = command[i + 2].rawValue;

		var internalCommand = [
			'!table',
			'get',
			'me',
			command[i].rawValue,
			key
		];

		var fakeStateHolder = helper.fakeStateHolder(stateHolder);
		fakeStateHolder.clearMessages();
		helper.handlers.execute(
			'!table',
			internalCommand,
			fakeStateHolder,
			function() {
				tmpCommand.push({
					type: 'QUOTED_STRING',
					rawValue: fakeStateHolder.result
				});

				for (var i = index + 4; i < command.length; i++) {
					tmpCommand.push(command[i]);
				}
				return cb(tmpCommand);
			}
		);
	}
};