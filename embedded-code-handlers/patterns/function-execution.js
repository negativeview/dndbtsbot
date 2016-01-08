var helper = require('../helper.js');

module.exports = {
	name: 'Function execution',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['FUNCTION'],
				['LEFT_PAREN'],
				['QUOTED_STRING'],
				['RIGHT_PAREN']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		var commandName = command[index].rawValue;
		var argument = command[index + 2].rawValue;

		console.log(commandName + '::' + argument);

		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		var internalCommand = [
			'!' + commandName,
		];

		var arguments = argument.split(" ");
		for (var i = 0; i < arguments.length; i++) {
			internalCommand.push(arguments[i]);
		}

		var fakeStateHolder = helper.fakeStateHolder(stateHolder);
		fakeStateHolder.clearMessages();
		helper.handlers.execute(
			'!' + commandName,
			internalCommand,
			fakeStateHolder,
			function(e) {
				if (e && e == 'Not a function') {
					helper.handlers.macro(
						'!' + commandName,
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
					return;
				}
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