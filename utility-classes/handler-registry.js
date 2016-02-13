var characterHandler    = require('../character-handler.js');
var diceHandler         = require('../dice-handler.js');
var echoHandler         = require('../echo-handler.js');
var EmbeddedCodeHandler = require('../embedded-code-handlers/base/embedded-code-handler.js');
var helpHandler         = require('../help-handler.js');
var macroHandler        = require('../macro-handler.js');
var rollstatsHandler    = require('../roll-stats.js');
var tableHandler        = require('../table-handler.js');
var varHandler          = require('../var-handler.js');
var weaponsStore        = require('../weapons-store.js');
var shortRollHandler    = require('../shorthand-dice-rolls.js');
var Token               = require('../token.js');

function HandlerRegistry(stateHolder) {
	this.stateHolder = stateHolder;
	this.mongoose = stateHolder.mongoose;
	this.bot = stateHolder.bot;

	var embeddedCodeHandler = new EmbeddedCodeHandler(stateHolder, this);

	var token = new Token(this.mongoose);

	this.handlers = {
		'!2': shortRollHandler.normal,
		'!2a': shortRollHandler.advantage,
		'!2d': shortRollHandler.disadvantage,
		'!r': diceHandler,
		'!roll': diceHandler,
		'!rollstats': rollstatsHandler.roll,
		'!echo': echoHandler.echo,
		'!echon': echoHandler.echon,
		'!pm': echoHandler.pm,
		'!help': helpHandler.run,
		'!macro': macroHandler.handle,
		'!var': varHandler.handle,
		'!table': tableHandler.handle,
		'!!': embeddedCodeHandler.handle.bind(embeddedCodeHandler),
		'!<': embeddedCodeHandler.debug.bind(embeddedCodeHandler),
		'!character': characterHandler.handle,
		'!attack': characterHandler.attack,
		'!weaponstore': weaponsStore.handle,
		'!token': token.handle.bind(token)
	};

	rollstatsHandler.init(diceHandler);
	shortRollHandler.init(diceHandler);
	helpHandler.init(this.mongoose);
	varHandler.init(this.mongoose);
	tableHandler.init(this.mongoose);
	characterHandler.init(this.mongoose, this);
	weaponsStore.init(this.mongoose);
}

HandlerRegistry.prototype.addHandler = function(command, handler) {
	this.handlers[command] = handler;
};

HandlerRegistry.prototype.findCommand = function(command) {
	if (command[0] != '!') {
		command = '!' + command;
	}
	if (command in this.handlers) return true;
	return false;
};

HandlerRegistry.prototype.execute = function(command, pieces, next) {
	var c = this.handlers[command];
	if (!c) {
		return next('Not a function: ' + command);
	}
	c(pieces, this.stateHolder, next);
};

HandlerRegistry.prototype.macro = function(command, pieces, next) {
	macroHandler.attempted(pieces, this.stateHolder, next);
};

module.exports = HandlerRegistry;