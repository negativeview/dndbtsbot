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
	'!pm': echoHandler.pm,
	'!help': helpHandler.run
}

var stateHolderClass = require('./state-holder.js');

function globalHandlerWrap(user, userID, channelID, message, rawEvent) {
	var stateHolder = stateHolderClass();
	
	stateHolder.init(mongoose, bot);
	globalHandler(user, userID, channelID, message, rawEvent, stateHolder);
}

function globalHandler(user, userID, channelID, message, rawEvent, stateHolder) {
	if (user == bot.username || user == bot.id) return;

	if (message[0] == '!') {
		var pieces = message.split(" ");
		if (pieces[0] in handlers) {
			handlers[pieces[0]](pieces, message, rawEvent, channelID, globalHandler, stateHolder, function() {
				stateHolder.doFinalOutput();
			});
		} else {
			adminmacroHandler.attempted(pieces, message, rawEvent, channelID, globalHandler, stateHolder, macroHandler.attempted, function() {
				stateHolder.doFinalOutput(rawEvent);
			});
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