var diceHandler = require('./dice-handler.js');
var echoHandler = require('./echo-handler.js');
var helpHandler = require('./help-handler.js');
var macroHandler = require('./macro-handler.js');
var presenceHandler = require('./presence-handler.js');
var rollstatsHandler = require('./roll-stats.js');
var varHandler = require('./var-handler.js');
var evaluateHandler = require('./evaluate-handler.js');
var gameHandler = require('./game-handler.js');
var eachHandler = require('./each-handler.js');

var handlers = {
	'!r': diceHandler,
	'!roll': diceHandler,
	'!rollstats': rollstatsHandler.roll,
	'!echo': echoHandler.echo,
	'!echon': echoHandler.echon,
	'!pm': echoHandler.pm,
	'!help': helpHandler.run,
	'!macro': macroHandler.handle,
	'!var': varHandler.handle,
	'!evaluate': evaluateHandler.evaluate,

	'!each': eachHandler.each,
	'!setuser': eachHandler.nop,

	'!role': gameHandler.setRole,
	'!roles': gameHandler.viewRoles,
}

var ret = {};
ret.init = function(mongoose, bot) {
	macroHandler.init(mongoose);
	presenceHandler.init(mongoose, bot);
	rollstatsHandler.init(diceHandler);
	helpHandler.init(mongoose);
	varHandler.init(mongoose);
	gameHandler.init(mongoose);
}

ret.findCommand = function(command) {
	if (command in handlers) return true;
	return false;
};

ret.execute = function(command, pieces, stateHolder, next) {
	var c = handlers[command];
	c(pieces, stateHolder, next);
};

ret.macro = function(command, pieces, stateHolder, next) {
	macroHandler.attempted(pieces, stateHolder, next);
};

module.exports = ret;