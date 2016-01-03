var mongoose         = require('mongoose');
var bot              = require('./authenticate.js');
var async            = require('async');
var handlers         = require('./handler-registry.js');
var block            = require('./execution-block.js');
var stateHolderClass = require('./state-holder.js');
var messageQueue     = require('./message-queue.js');

function globalHandlerWrap(user, userID, channelID, message, rawEvent) {
	if (user == bot.username || user == bot.id) return;
	if (message[0] != '!') return;

	var stateHolder = stateHolderClass(user, userID, channelID, rawEvent);
	stateHolder.verified = true;
	var b = block.create(mongoose, bot, stateHolder);

	b.setHandlers(handlers);

	globalHandlerMiddle(message, b, function(err) {
		stateHolder.doFinalOutput();
		forcePump();
		if (err) return;
		bot.deleteMessage({channel: rawEvent.d.channel_id, messageID: rawEvent.d.id});
	});
}

function globalHandlerMiddle(message, block, cb) {
	var splitMessages = message.split("\n");

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
		return cb();
	}

	/**
	 * If it's not one of those special commands, split commands up and run them individually.
	 **/
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
	block.setNext(cb);
	block.execute();
}

function onBotReady() {
	console.log(bot.username + " - (" + bot.id + ")");
	bot.setPresence({game: 'PseuPseuPseudeo'});
}

function onBotDisconnected() {
	console.log('disconnected...');
	bot.connect();
}

var timeoutID = null;
function pump() {
	timeoutID = null;
	messageQueue.pump(bot, function(timeout) {
		if (timeout && timeoutID == null) {
			timeoutID = setTimeout(pump, timeout);
		}
	});
}

function forcePump() {
	if (timeoutID) return;
	pump();
}

function onMongoose(err) {
	if (err) throw err;

	handlers.init(mongoose, bot);

	bot.on('ready', onBotReady);
	bot.on('message', globalHandlerWrap);
	bot.on('disconnected', onBotDisconnected);
}

mongoose.connect('mongodb://127.0.0.1/test', onMongoose);