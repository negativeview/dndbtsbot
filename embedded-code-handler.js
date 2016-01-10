var async     = require('async');
var helper    = require('./embedded-code-handlers/helper.js');
var patterns  = require('./embedded-code-handlers/patterns/all.js');
var tokenizer = require('./embedded-code-handlers/base/tokenizer.js');

var ret = {
	patterns: [
		patterns.deleteTableKey,
		patterns.deleteTable,
		patterns.booleanOr,
		patterns.booleanAnd,
		patterns.tableActualSet,
		patterns.doForeach,
		patterns.doIfElse,
		patterns.doIf,
		patterns.variableDotEquals,
		patterns.comparison,
		patterns.variableAssignment,
		patterns.mathAndConcat,
		patterns.equality,
		patterns.ternary,
		patterns.echo,
		patterns.pm,
		patterns.ignore,
		patterns.functionExecution,
		patterns.squashParens,
		patterns.macroArguments,
		patterns.variableDotBracket,
		patterns.tableLookups,
		patterns.variableDot,
		patterns.normalVariable,
		patterns.tableActualLookup
	]
};

ret.setHandlers = function(handlers) {
	ret.handlers = handlers;
	helper.handlers = handlers;
};

ret.setMongoose = function(mongoose) {
	ret.mongoose = mongoose;
	ret.varModel = mongoose.model('Var');
	ret.characterModel = mongoose.model('Character');
	ret.tableModel = mongoose.model('Table');
	ret.tableRowModel = mongoose.model('TableRow');
}

function handleSingleCommand(stateHolder, command, state, callback) {
	if (command.length == 0) return callback(command);

	for (var i = 0; i < ret.patterns.length; i++) {
		var pattern = ret.patterns[i];
		var found = pattern.matches(command);
		if (found !== false) {
			pattern.work(stateHolder, found, command, state, ret.handlers, executeCommands, function(newCommand) {
				handleSingleCommand(stateHolder, newCommand, state, callback);
			});
			return;
		}
	};

	ret.stateHolder.simpleAddMessage(ret.stateHolder.username, 'Got to end of command without being able to process it completely. Here\'s what\'s left:');
	for (var i = 0; i < command.length; i++) {
		ret.stateHolder.simpleAddMessage(ret.stateHolder.username, "\n");
		ret.stateHolder.simpleAddMessage(ret.stateHolder.username, command[i].type + ': ' + command[i].rawValue);
	}

	return callback(command);
}

function executeCommands(commands, state, next) {
	var totalCommands = [];
	var currentCommands = [];
	
	for (var i = 0; i < commands.length; i++) {
		var command = commands[i];
		currentCommands.push(command);
		if (command.type == 'SEMICOLON') {
			totalCommands.push(currentCommands);
			currentCommands = [];			
		} else if (command.type == 'BLOCK') {
			if (commands.length > i + 1) {
				if (commands[i + 1].type != 'ELSE') {
					totalCommands.push(currentCommands);
					currentCommands = [];
				}
			}
		}
	}

	if (currentCommands.length) {
		totalCommands.push(currentCommands);
	}

	async.eachSeries(
		totalCommands,
		function(iterator, callback) {
			var temporaryStateHolder = ret.stateHolder.clone();
			temporaryStateHolder.isTemporary = true;
			temporaryStateHolder.real = ret.stateHolder;

			handleSingleCommand(temporaryStateHolder, iterator, state, function(result) {
				temporaryStateHolder.clearMessages(ret.stateHolder.channelID);
				callback();
			});
		},
		function() {
			next();
		}
	);
}

ret.debug = function(pieces, stateHolder, next) {
	var command = '';
	for (var i = 1; i < pieces.length; i++) {
		if (command != '')
			command += ' ';
		command += pieces[i];
	}

	try {
		tokenizer(command, ret, function(commands) {
			stateHolder.simpleAddMessage(stateHolder.username, JSON.stringify(commands, ['rawValue', 'type'], "      "));
			return next();
		});
		return;
	} catch (e) {
		stateHolder.simpleAddMessage(stateHolder.username, e);
	}
	return next();
}

ret.handle = function(pieces, stateHolder, next) {
	ret.stateHolder = stateHolder;
	ret.stateHolder.errorList = [];
	ret.stateHolder.verified = false;

	var state = {
		variables: stateHolder.incomingVariables ? stateHolder.incomingVariables : {},
		args: ('originalArgs' in stateHolder) ? stateHolder.originalArgs : pieces
	};

	var command = '';
	for (var i = 1; i < pieces.length; i++) {
		if (command != '')
			command += ' ';
		command += pieces[i];
	}

	try {
		tokenizer(command, ret, function(commands) {
			executeCommands(commands, state, function() {
				if (ret.stateHolder.errorList.length) {
					stateHolder.simpleAddMessage(stateHolder.username, ret.stateHolder.errorList.join("\n"));
				}
				next(null, state);
			});
		});
	} catch (e) {
		stateHolder.simpleAddMessage(stateHolder.username, e);
	}
	return;
}

module.exports = ret;