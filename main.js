var executionHelper  = require('./execution-helper.js');
var mongoose         = require('mongoose');
var bot              = require('./authenticate.js');
var async            = require('async');
var handlers         = require('./handler-registry.js');
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

	updateChannelTitles();

	// We early return if the message doesn't start with an exclamation point.
	if (message[0] != '!') return;

	// Now that we're actually comitting to processing the message, set up a
	// state holder.
	var stateHolder = stateHolderClass(user, userID, channelID, rawEvent);
	stateHolder.init(mongoose, bot);

	// Default to verified. It's easier to un-verify when we run user-provided
	// code than it is to verify all input.
	stateHolder.verified = true;

	executionHelper.handle(message, stateHolder, function(err) {
		stateHolder.doFinalOutput();
		forcePump();
		if (err) return;
		bot.deleteMessage({channel: rawEvent.d.channel_id, messageID: rawEvent.d.id});
	});
}

var lastUpdate = '';

function updateChannelTitles() {
	var announcementChannelID = '123184695289577474';
	//var announcementChannelID = '132594342954139648';

	var moment = require('moment');
	var m = moment().utc();
	m.subtract(7, 'hours');

	var hours = m.hours();

	var amPM = 'AM';
	if (hours > 12) {
		hours = hours - 12;
		amPM = 'PM';
	}

	var shouldBeTopic = 'Time: ' + hours + ':XX ' + amPM;

	if (lastUpdate != shouldBeTopic) {
		lastUpdate = shouldBeTopic;

		var toSend = {to: announcementChannelID, message: lastUpdate};
		console.log(toSend);
		bot.sendMessage(toSend, function(err) {
			if (err) console.log(err);
		});
	}

	/*
	if (shouldBeTopic != topic) {
		bot.editChannelInfo(
			{
				channel: '132594342954139648',
				topic: shouldBeTopic
			}
		);
	}
	*/
}

function onBotReady() {
	var currentRelease = 'Boogie Woogie';

	console.log(bot.username + " - (" + bot.id + ")");
	bot.setPresence({game: currentRelease});
}

function updateRoomTopic() {

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

	bot.on('ready',        onBotReady);
	bot.on('message',      globalHandlerWrap);
	bot.on('disconnected', onBotDisconnected);
	bot.connect();
}

mongoose.connect('mongodb://127.0.0.1/test', onMongoose);