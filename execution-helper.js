var async    = require('async');

var ret = {};

ret.handle = function(message, stateHolder, cb) {
	var handlers = require('./handler-registry.js');

	console.log(message);

	var splitMessages = message.split("\n");

	var messages = [];

	var message = '';
	for (var i = 0; i < splitMessages.length; i++) {
		var newLine = splitMessages[i];

		if (newLine.indexOf("!macro") === 0 || message.indexOf("!!") === 0) {
			message += newLine + "\n";
			for (var m = i + 1; m < splitMessages.length; m++) {
				message += "\n" + splitMessages[m];
			}
			messages[messages.length] = message.replace("\n", '');
			message = '';
			break;			
		}

		if (newLine[0] == '!') {
			if (message.length != 0) {
				messages[messages.length] = message.replace("\n", '');
				message = '';
			}
		}

		if (message.length != 0) message += " \n";
		message += newLine;
	}
	if (message.length != 0) {
		messages[messages.length] = message.replace("\n", '');
	}

	async.eachSeries(
		messages,
		function(statement, next) {
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
				if (stateHolder.inMacro) {
					return next();
				}
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