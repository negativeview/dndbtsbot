var async            = require('async');
var bot              = require('./authenticate.js');
var ExecutionHelper  = require('./utility-classes/execution-helper.js');
var MessageQueue     = require('./utility-classes/message-queue.js');
var mongoose         = require('mongoose');
var mongooseModels   = require('./mongoose-models.js');
var StateHolder      = require('./utility-classes/state-holder.js');

function globalHandlerWrap(user, userID, channelID, message, rawEvent) {
	if (user == bot.username || user == bot.id) return;

	updateChannelTitles();

	if (message[0] != '!') return;

	var stateHolder = new StateHolder(messageQueue, user, bot, mongoose, userID, channelID, rawEvent);
	var executionHelper = new ExecutionHelper(stateHolder);
	executionHelper.handle(message, function(err) {
		stateHolder.doFinalOutput();
		forcePump();
		if (err) return;
		bot.deleteMessage({channel: rawEvent.d.channel_id, messageID: rawEvent.d.id});
	});
}

var lastUpdate = '';

function updateChannelTitles() {
	var announcementChannels = [
		'123184695289577474',
		//'132594342954139648'
	];

	var moment = require('moment');
	var m = moment().utc();
	m.subtract(7, 'hours');

	var hours = m.hours();

	var amPM = 'AM';
	if (hours > 12) {
		hours = hours - 12;
		amPM = 'PM';
	}

	if (hours == 0) hours = 12;

	var shouldBeTopic = 'Time: ' + hours + ':XX ' + amPM;

	/*
	if (lastUpdate != shouldBeTopic) {
		lastUpdate = shouldBeTopic;

		for (var i = 0; i < announcementChannels.length; i++) {
			var toSend = {to: announcementChannels[i], message: lastUpdate};
			bot.sendMessage(toSend, function(err) {
				if (err) console.log(err);
			});
		}
	}
	*/

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

var messageQueue;
function onBotReady() {
	messageQueue = new MessageQueue();

	var currentRelease = 'Boogie Woogie';

	console.log(bot.username + " - (" + bot.id + ")");
	bot.setPresence({game: currentRelease});
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

	mongooseModels(mongoose);

	bot.on('ready',        onBotReady);
	bot.on('message',      globalHandlerWrap);
	bot.on('disconnected', onBotDisconnected);
	bot.connect();
}

mongoose.connect('mongodb://127.0.0.1/test', onMongoose);