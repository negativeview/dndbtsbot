var async    = require('async');

var ret = {};

ret.handle = function(message, stateHolder, cb) {
	var handlers = require('./handler-registry.js');

	var splitMessages = message.split("\n");

	var messages = [];

	for (var i = 0; i < splitMessages.length; i++) {
		var message = splitMessages[i];
		if (message.indexOf("!macro") === 0 || message.indexOf("!!") === 0) {
			for (var m = i + 1; m < splitMessages.length; m++) {
				message += "\n" + splitMessages[m];
			}
			messages[messages.length] = message;
			break;
		} else {
			messages[messages.length] = message;
		}
	}

	async.eachSeries(
		messages,
		function(statement, next) {
			console.log('incoming statement', statement);
			var pieces = statement.split(" ");
			var command = pieces[0];

			var commandFound = handlers.findCommand(command);
			if (commandFound) {
				handlers.execute(
					command,
					pieces,
					stateHolder,
					next
				);
			} else {
				handlers.macro(
					command,
					pieces,
					stateHolder,
					next
				);
			}
		},
		function(err) {
			if (err) console.log(err);
			return cb();
		}
	);
};

module.exports = ret;