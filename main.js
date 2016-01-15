var async            = require('async');
var bot              = require('./authenticate.js');
var ExecutionHelper  = require('./utility-classes/execution-helper.js');
var MessageQueue     = require('./utility-classes/message-queue.js');
var mongoose         = require('mongoose');
var mongooseModels   = require('./mongoose-models.js');
var StateHolder      = require('./utility-classes/state-holder.js');
var TimeBasedUpdates = require('./time-based-updates.js');

function globalHandlerWrap(user, userID, channelID, message, rawEvent) {
	if (user == bot.username || user == bot.id) return;

	timeBasedUpdates.update();

	if (message[0] != '!') return;

	var stateHolder = new StateHolder(messageQueue, user, bot, mongoose, userID, channelID, rawEvent);
	var executionHelper = new ExecutionHelper(stateHolder);
	executionHelper.handle(message, function(err) {
		if (err) {
			stateHolder.simpleAddMessage(userID, 'ERROR:' + err);
		}
		stateHolder.doFinalOutput();
		forcePump();
		if (err) return;
		bot.deleteMessage({channel: rawEvent.d.channel_id, messageID: rawEvent.d.id});
	});
}

var lastUpdate = '';

var messageQueue;
var timeBasedUpdates;

function onBotReady() {
	messageQueue = new MessageQueue();
	timeBasedUpdates = new TimeBasedUpdates(bot, mongoose, messageQueue);

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