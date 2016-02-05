var async = require('async');
var HandlerRegistry = require('./handler-registry.js');

var ret = {};

function ExecutionHelper(stateHolder) {
	this.stateHolder = stateHolder;
	this.stateHolder.executionHelper = this;
	this.handlers = new HandlerRegistry(stateHolder);
}

ExecutionHelper.prototype.handle = function(message, cb) {
	var splitMessages = message.split("\n");
	var messages = [];

	var message = '';
	for (var i = 0; i < splitMessages.length; i++) {
		var newLine = splitMessages[i];
		if (newLine.indexOf("!macro") === 0 || message.indexOf("!!") === 0) {
			message += newLine + " \n";
			for (var m = i + 1; m < splitMessages.length; m++) {
				message += "\n" + splitMessages[m];
			}
			messages[messages.length] = message.replace(/\n/, '');
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

	console.log('messages', messages);

	this.handleParsedMessages(messages, cb);
};

ExecutionHelper.prototype.handleParsedMessages = function(messages, cb) {
	async.eachSeries(
		messages,
		(statement, next) => {
			var pieces = statement.split(" ");
			var command = pieces[0];

			var commandFound = this.handlers.findCommand(command);
			if (commandFound) {
				this.handlers.execute(
					command,
					pieces,
					next
				);
			} else {
				this.handlers.macro(
					command,
					pieces,
					next
				);
			}
		},
		(err) => {
			return cb(err);
		}
	);
};

module.exports = ExecutionHelper;