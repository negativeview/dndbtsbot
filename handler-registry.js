var characterHandler    = require('./character-handler.js');
var diceHandler         = require('./dice-handler.js');
var echoHandler         = require('./echo-handler.js');
var embeddedCodeHandler = require('./embedded-code-handler.js');
var evaluateHandler     = require('./evaluate-handler.js');
var gameHandler         = require('./game-handler.js');
var helpHandler         = require('./help-handler.js');
var macroHandler        = require('./macro-handler.js');
var rollstatsHandler    = require('./roll-stats.js');
var tableHandler        = require('./table-handler.js');
var varHandler          = require('./var-handler.js');
var weaponsStore        = require('./weapons-store.js');

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
	'!table': tableHandler.handle,
	'!!': embeddedCodeHandler.handle,
	'!<': embeddedCodeHandler.debug,
	'!character': characterHandler.handle,
	'!attack': characterHandler.attack,
	'!weaponstore': weaponsStore.handle
}

var ret = {};
ret.init = function(mongoose, bot) {
	macroHandler.init(mongoose);
	rollstatsHandler.init(diceHandler);
	helpHandler.init(mongoose);
	varHandler.init(mongoose);
	gameHandler.init(mongoose);
	tableHandler.init(mongoose);
	embeddedCodeHandler.setHandlers(ret);
	characterHandler.init(mongoose, ret);
	embeddedCodeHandler.setMongoose(mongoose);
	weaponsStore.init(mongoose);
}

ret.addHandler = function(command, handler) {
	handlers[command] = handler;
};

ret.findCommand = function(command) {
	if (command[0] != '!') {
		command = '!' + command;
	}
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