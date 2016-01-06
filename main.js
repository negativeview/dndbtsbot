var mongoose         = require('mongoose');
var bot              = require('./authenticate.js');
var async            = require('async');
var handlers         = require('./handler-registry.js');
var block            = require('./execution-block.js');
var stateHolderClass = require('./state-holder.js');
var messageQueue     = require('./message-queue.js');

/**
 * Highest-level validation that we even want to process this message further.
 * If we do, it passes the message to globalHandlerMiddle.
 */
function globalHandlerWrap(user, userID, channelID, message, rawEvent) {
	// Ignore messages from ourselves, so that we don't accidentally
	// send ourselves into an infinite loop.
	if (user == bot.username || user == bot.id) return;

	// We early return if the message doesn't start with an exclamation point.
	if (message[0] != '!') return;

	// Now that we're actually comitting to processing the message, set up a
	// state holder.
	var stateHolder = stateHolderClass(user, userID, channelID, rawEvent);

	// Default to verified. It's easier to un-verify when we run user-provided
	// code than it is to verify all input.
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

/**
 * onMongoose is called when mongoose (our data store) is ready. It handles initializing all our other
 * callbacks and actually connects to discord.
 */
function onMongoose(err) {
	if (err) throw err;

	handlers.init(mongoose, bot);

	bot.on('ready', onBotReady);
	bot.on('message', globalHandlerWrap);
	bot.on('disconnected', onBotDisconnected);
	bot.connect();
}

mongoose.connect('mongodb://127.0.0.1/test', onMongoose);