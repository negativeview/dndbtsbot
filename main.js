var diceHandler = require('./dice-handler.js');
var echoHandler = require('./echo-handler.js');
var helpHandler = require('./help-handler.js');
var macroHandler = require('./macro-handler.js');
var rollstatsHandler = require('./roll-stats.js');
var timeHandler = require('./time-handler.js');
var bot = require('./authenticate.js');
var mongoose = require('mongoose');

macroHandler.init(mongoose);
timeHandler.init(mongoose);
rollstatsHandler.init(diceHandler);

var Macro = mongoose.model('Macro');

mongoose.connect('mongodb://127.0.0.1/test', function(err) {
	if (err) throw err;

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

	var handlers = {
		'!r': diceHandler,
		'!roll': diceHandler,
		'!rollstats': rollstatsHandler.roll,
		'!time': timeHandler.parse,
		'!timezone': timeHandler.timezone,
		'!setmacro': macroHandler.set,
		'!viewmacro': macroHandler.view,
		'!removemacro': macroHandler.remove,
		'!echo': echoHandler,
		'!help': helpHandler
	}

	var globalHandler = function(user, userID, channelID, message, rawEvent) {
		if (user == bot.username || user == bot.id) return;
		
		if (message[0] == '!') {
			var pieces = message.split(" ");
			if (pieces[0] in handlers) {
				console.log(pieces[0]);
				handlers[pieces[0]](pieces, message, rawEvent, bot, channelID, globalHandler);
			} else {
				if (user == '' && userID == '') {
					return;
				} else {
					var successful = macroHandler.attempted(pieces, message, rawEvent, bot, channelID, globalHandler);
					if (!successful) {
						return;
					}
				}
			}
		}
	};

	bot.on('message', globalHandler);
});

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}