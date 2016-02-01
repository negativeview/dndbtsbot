var async            = require('async');
var ExecutionHelper  = require('./utility-classes/execution-helper.js');
var MessageQueue     = require('./utility-classes/message-queue.js');
var mongoose         = require('mongoose');
var mongooseModels   = require('./mongoose-models.js');
var StateHolder      = require('./utility-classes/state-holder.js');
var TimeBasedUpdates = require('./time-based-updates.js');

process.on('uncaughtException', function(err) {
	if (err.node) {
		console.log('uncaughtException', err.node);
		var stateHolder = err.codeHandler.stateHolder;
		var message = err.toString() + "\n" + err.node.parent.toString() + "\n" + err.node.tokenList.map(function(a) { return a.rawValue; }).join(', ');
		stateHolder.simpleAddMessage(stateHolder.channelID, message);
		stateHolder.doFinalOutput();
		forcePump();
	} else {
		console.log(err.stack);
		process.exit(1);
	}
});

function globalHandlerWrap(user, userID, channelID, message, rawEvent) {
	if (user == bot.username || user == bot.id) return;

	if (message[0] != '!') return;

	var stateHolder = new StateHolder(messageQueue, user, bot, mongoose, userID, channelID, rawEvent);
	var executionHelper = new ExecutionHelper(stateHolder);
	executionHelper.handle(message, function(err) {
		if (err) {
			console.log('error', err);
			stateHolder.simpleAddMessage(channelID, 'ERROR:' + err);
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

var bot = {
	servers: {
		server: {
			members: {}
		}
	},
	serverFromChannel: function() {
		return 'server';
	}
};

/**
 * onMongoose is called when mongoose (our data store) is ready. It handles initializing all our other
 * callbacks and actually connects to discord.
 */
function onMongoose(err) {
	if (err) throw err;

	mongooseModels(mongoose);

	var rawEvent = {
		d: {
			author: {
				id: 'user-id'
			}
		}
	};

	process.stdin.setEncoding('utf-8');
	var message = '';
	process.stdin.on('readable', () => {
		var chunk = process.stdin.read();
		if (chunk != null) {
			if (chunk == "\n") {
				console.log('message: ' + message);
				var stateHolder = new StateHolder(messageQueue, 'user-id', bot, mongoose, 'user-id2', 'channel-id', rawEvent);
				var executionHelper = new ExecutionHelper(stateHolder);
				executionHelper.handle(message, function(err) {
					console.log('error:', err);
					console.log('outgoing messages:', stateHolder.messages);
				});
				message = '';
				return;
			}
			message += chunk;
		}
	});
}

mongoose.connect('mongodb://127.0.0.1/test', onMongoose);