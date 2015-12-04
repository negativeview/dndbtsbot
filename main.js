var mongoose = require('mongoose');
var adminmacroHandler = require('./adminmacro-handler.js');
var diceHandler = require('./dice-handler.js');
var echoHandler = require('./echo-handler.js');
var helpHandler = require('./help-handler.js');
var macroHandler = require('./macro-handler.js');
var presenceHandler = require('./presence-handler.js');
var rollstatsHandler = require('./roll-stats.js');
var timeHandler = require('./time-handler.js');
var bot = require('./authenticate.js');
var async = require('async');
var evaluateHandler = require('./evaluate-handler.js');

var handlers = {
	'!adminsetmacro': adminmacroHandler.set,
	'!adminremovemacro': adminmacroHandler.remove,
	'!r': diceHandler,
	'!roll': diceHandler,
	'!rollstats': rollstatsHandler.roll,
	'!time': timeHandler.parse,
	'!timezone': timeHandler.timezone,
	'!setmacro': macroHandler.set,
	'!viewmacro': macroHandler.view,
	'!removemacro': macroHandler.remove,
	'!echo': echoHandler.echo,
	'!echon': echoHandler.echon,
	'!pm': echoHandler.pm,
	'!help': helpHandler.run,
	'!evaluate': evaluateHandler.evaluate
}

var stateHolderClass = require('./state-holder.js');

function globalHandlerWrap(user, userID, channelID, message, rawEvent) {
	if (user == bot.username || user == bot.id) return;

	console.log('ghw:' + message);
	var stateHolder = stateHolderClass();
	
	stateHolder.init(mongoose, bot);
	globalHandlerMiddle(user, userID, channelID, message, rawEvent, stateHolder)
}

function globalHandlerMiddle(user, userID, channelID, message, rawEvent, stateHolder, callback) {
	console.log('ghm:' + message);
	/**
	 * If our first command is setmacro or adminsetmacro, we need to treat things specially.
	 * Instead of being able to process multiple commands in a message, we must gobble the whole
	 * thing up.
	 **/
	if (
		(message.indexOf("!setmacro") === 0) ||
		(message.indexOf("!adminsetmacro") === 0)
	) {
		globalHandler(user, userID, channelID, message, rawEvent, stateHolder, function() {
			stateHolder.doFinalOutput();
		});
		return;
	}

	/**
	 * If it's not one of those special commands, split commands up and run them individually.
	 **/
	var splitMessages = message.split("\n");

	var realMessages = [];

	var currentMessage = splitMessages[0];
	for (var i = 1; i < splitMessages.length; i++) {
		if (splitMessages[i][0] != '!') {
			currentMessage += "\n" + splitMessages[i]
		} else {
			realMessages.push(currentMessage);
			currentMessage = splitMessages[i];
		}
	}
	realMessages.push(currentMessage);

	async.eachSeries(
		realMessages,
		function(item, callback) {
			globalHandler(user, userID, channelID, item, rawEvent, stateHolder, callback);
		},
		function() {
			stateHolder.doFinalOutput();
			if (callback) {
				//callback();
			}
		}
	);
}

function globalHandler(user, userID, channelID, message, rawEvent, stateHolder, next) {
	console.log('gh:' + message);

	if (message[0] == '!') {
		var pieces = message.split(" ");
		if (pieces[0] in handlers) {
			handlers[pieces[0]](pieces, message, rawEvent, channelID, globalHandlerMiddle, stateHolder, next);
		} else {
			adminmacroHandler.attempted(
				pieces,
				message,
				rawEvent,
				channelID,
				globalHandlerMiddle,
				stateHolder,
				macroHandler.attempted,
				next
			);
		}
	}
};

mongoose.connect('mongodb://127.0.0.1/test', function(err) {
	if (err) throw err;

	adminmacroHandler.init(mongoose);
	macroHandler.init(mongoose);
	timeHandler.init(mongoose);
	presenceHandler.init(mongoose, bot);
	rollstatsHandler.init(diceHandler);
	helpHandler.init(mongoose);

	var Macro = mongoose.model('Macro');

	var usedTimezones = [];

	for (i = -14; i < 0; i++) {
		usedTimezones[usedTimezones.length] = {
			code: 'Etc/GMT' + i,
			name: 'GMT+' + (-1 * i)
		};
	}
	usedTimezones[usedTimezones.length] = {
		code: 'Etc/GMT+0',
		name: 'GMT'
	};

	for (i = 1; i <= 12; i++) {
		usedTimezones[usedTimezones.length] = {
			code: 'Etc/GMT+' + i,
			name: 'GMT-' + i
		};
	}

	bot.on('ready', function() {
		console.log(bot.username + " - (" + bot.id + ")");
	});

	bot.on('message', globalHandlerWrap);

	bot.on('presence', presenceHandler.presence);
});

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}