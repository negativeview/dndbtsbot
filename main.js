var auth             = require('./authenticate.js');
var async            = require('async');
var ExecutionContext = require('./utility-classes/execution-context.js');
var ExecutionHelper  = require('./utility-classes/execution-helper.js');
var MessageQueue     = require('./utility-classes/message-queue.js');
var mongoose         = require('mongoose');
var mongooseModels   = require('./mongoose-models.js');
var StateHolder      = require('./utility-classes/state-holder.js');
var TimeBasedUpdates = require('./time-based-updates.js');
var bot              = auth.bot;

process.on(
	'uncaughtException',
	(err) => {
		if (err.node) {
			console.log('uncaughtException', err.node);
			var stateHolder = err.codeHandler.stateHolder;
			var message = err.toString() + "\n" + err.node.parent.toString() + "\n" + err.node.tokenList.map(function(a) { return a.rawValue; }).join(', ');
			stateHolder.simpleAddMessage(stateHolder.channelID, message);
			stateHolder.doFinalOutput();
			forcePump();
		} else {
			console.log(err, err.stack);
		}
	}
);

/**
 * Highest-level validation that we even want to process this message further.
 * If we do, it passes the message to globalHandlerMiddle.
 */
function globalHandlerWrap(user, userID, channelID, message, rawEvent) {
	if (user == bot.username || user == bot.id) return;

	if (message[0] != '!') return;

	var executionContext = new ExecutionContext(bot, rawEvent);
	executionContext.preseedVariables(
		mongoose,
		() => {
			timeBasedUpdates.update(executionContext);

			var stateHolder = new StateHolder(messageQueue, user, bot, mongoose, userID, channelID, rawEvent);
			var executionHelper = new ExecutionHelper(stateHolder, executionContext);
			executionHelper.handle(
				message,
				(err) => {
					if (err) {
						stateHolder.simpleAddMessage(channelID, err);
					}
					stateHolder.doFinalOutput();
					forcePump();
					if (err) return;
					bot.deleteMessage({channel: rawEvent.d.channel_id, messageID: rawEvent.d.id});
				}
			);
		}
	);
}

var lastUpdate = '';

var messageQueue;
var timeBasedUpdates;

function onBotReady() {
	messageQueue = new MessageQueue();
	timeBasedUpdates = new TimeBasedUpdates(bot, mongoose, messageQueue);

	var currentRelease = 'Blues';

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
	messageQueue.pump(
		bot,
		(timeout) => {
			if (timeout && timeoutID == null) {
				timeoutID = setTimeout(pump, timeout);
			}
		}
	);
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