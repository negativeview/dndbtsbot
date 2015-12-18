var mongoose = require('mongoose');
var bot = require('./authenticate.js');
var async = require('async');
var handlers = require('./handler-registry.js');
var block = require('./execution-block.js');
var stateHolderClass = require('./state-holder.js');	

function globalHandlerWrap(user, userID, channelID, message, rawEvent) {
	if (user == bot.username || user == bot.id) return;

	if (message[0] != '!') return;

	var stateHolder = stateHolderClass(user, userID, channelID, rawEvent);
	var b = block.create(mongoose, bot, stateHolder);
	b.setHandlers(handlers);

	globalHandlerMiddle(message, b);

	bot.deleteMessage({channel: rawEvent.d.channel_id, messageID: rawEvent.d.id});
}

function globalHandlerMiddle(message, block) {
	/**
	 * If our first command is setmacro or adminsetmacro, we need to treat things specially.
	 * Instead of being able to process multiple commands in a message, we must gobble the whole
	 * thing up.
	 **/
	if (
		(message.indexOf("!macro") === 0)
	) {
		block.addStatement(message);
		block.execute();
		return;
	}

	/**
	 * If it's not one of those special commands, split commands up and run them individually.
	 **/
	var splitMessages = message.split("\n");
	var currentMessage = splitMessages[0];
	for (var i = 1; i < splitMessages.length; i++) {
		if (splitMessages[i][0] != '!') {
			currentMessage += "\n" + splitMessages[i]
		} else {
			block.addStatement(currentMessage);
			currentMessage = splitMessages[i];
		}
	}
	block.addStatement(currentMessage);

	block.execute();
}

mongoose.connect('mongodb://127.0.0.1/test', function(err) {
	if (err) throw err;

	handlers.init(mongoose, bot);

	bot.on('ready', function() {
		console.log(bot.username + " - (" + bot.id + ")");
	});

	bot.on('message', globalHandlerWrap);

	bot.on('disconnected', function() {
		console.log('disconnected...');
		bot.connect();
	});
});

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}