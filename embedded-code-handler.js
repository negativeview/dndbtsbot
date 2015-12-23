var lexer = require('lex');
var async = require('async');
var helper   = require('./embedded-code-handlers/helper.js');
var patterns = require('./embedded-code-handlers/patterns/all.js');

var channel = require('./embedded-code-handlers/channel.js');
var user = require('./embedded-code-handlers/user.js');
var server = require('./embedded-code-handlers/server.js');
var character = require('./embedded-code-handlers/character.js');

var ret = {
	patterns: [
		patterns.doForeach,
		patterns.variableDotEquals,
		patterns.comparison,
		patterns.variableAssignment,
		patterns.mathAndConcat,
		patterns.equality,
		patterns.ternary,
		patterns.tableLookups,
		patterns.echo,
		patterns.pm,
		patterns.ignore,
		patterns.functionExecution,
		patterns.squashParens,
		patterns.macroArguments,
		patterns.variableDot,
		patterns.normalVariable,
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

function fixStrings(command) {
	var workingCommand = [];
	var inString = false;
	var workingString = '';
	var stringType = null;
	for (var m = 0; m < command.length; m++) {
		var token = command[m];
		if (!inString) {
			if (token.type == 'SINGLE_QUOTE') {
				inString = true;
				stringType = 'SINGLE_QUOTE';
			} else if (token.type == 'DOUBLE_QUOTE') {
				inString = true;
				stringType = 'DOUBLE_QUOTE';
			} else {
				workingCommand.push(token);
			}
		} else {
			if (token.type == stringType) {
				stringType = null;
				inString = false;
				token = {
					type: 'QUOTED_STRING',
					rawValue: workingString
				};
				workingString = '';
				workingCommand.push(token);
			} else {
				workingString += token.rawValue;
			}
		}
	}
	return workingCommand;
}

function removeWhitespace(command) {
	var workingCommand = [];
	for (var m = 0; m < command.length; m++) {
		var token = command[m];
		if (token.type != 'WHITESPACE') {
			workingCommand.push(token);
		}
	}
	return workingCommand;
}

function decideStringOrVariable(command) {
	var workingCommand = [];
	for (var m = 0; m < command.length; m++) {
		var token = command[m];
		if (token.type == 'STRING') {
			if (ret.handlers.findCommand(token.rawValue)) {
				token = {
					rawValue: token.rawValue,
					type: 'FUNCTION'
				};
				workingCommand.push(token);
			} else {
				var pieces = token.rawValue.split(".");
				for (var n = 0; n < pieces.length; n++) {
					if (n != 0) {
						token = {
							rawValue: '.',
							type: 'DOT'
						}
						workingCommand.push(token);
					}
					if (n == 0 && pieces[n] == 'channel') {
						token = {
							rawValue: 'channel',
							object: channel(ret.stateHolder, ret.varModel, ret.tableModel, ret.tableRowModel),
							type: 'CHANNEL'
						};
					} else if (n == 0 && pieces[n] == 'user') {
						token = {
							rawValue: 'user',
							object: user(ret.stateHolder, ret.varModel, ret.tableModel, ret.tableRowModel),
							type: 'USER'
						};
					} else if (n == 0 && pieces[n] == 'character') {
						token = {
							rawValue: 'character',
							object: character(ret.stateHolder, ret.characterModel, ret.varModel, ret.tableModel, ret.tableRowModel),
							type: 'CHARACTER'
						};
					} else if (n == 0 && pieces[n] == 'server') {
						token = {
							rawValue: 'server',
							object: server(ret.stateHolder, ret.varModel, ret.tableModel, ret.tableRowModel),
							type: 'SERVER'
						};
					} else {
						token = {
							rawValue: pieces[n],
							type: 'VARIABLE',
						};
					}
					workingCommand.push(token);
				}
			}
		} else {
			workingCommand.push(token);
		}
	}
	return workingCommand;
}

function executeCommands(commands, state, next) {
	var totalCommands = [];
	var currentCommands = [];
	for (var i = 0; i < commands.length; i++) {
		var command = commands[i];
		currentCommands.push(command);
		if (command.type == 'BLOCK' || command.type == 'SEMICOLON') {
			totalCommands.push(currentCommands);
			currentCommands = [];
		}
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

function breakIntoStatementsAndBlocks(tokens) {
	while (true) {
		var createdBlock = false;
		var blockStartIndex = 0;
		var inBlock = false;

		for (var i = 0; i < tokens.length; i++) {
			var token = tokens[i];
			if (token.type == 'LEFT_CURLY') {
				blockStartIndex = i;
				inBlock = true;
			}
			if (token.type == 'RIGHT_CURLY') {
				if (inBlock) {
					createdBlock = true;
					break;
				}
			}
		}

		if (createdBlock) {
			var endLocation = i;
			var tmpTokens = [];
			for (var i = 0; i < blockStartIndex; i++) {
				tmpTokens.push(tokens[i]);
			}

			var blockContents = [];
			for (var i = blockStartIndex + 1; i < endLocation; i++) {
				blockContents.push(tokens[i]);
			}

			var blockToken = {
				type: 'BLOCK',
				rawValue: '...',
				internal: blockContents
			};
			tmpTokens.push(blockToken);

			for (var i = endLocation + 1; i < tokens.length; i++) {
				tmpTokens.push(tokens[i]);
			}
			tokens = tmpTokens;
		} else {
			break;
		}
	}

	return tokens;
}

function tokenize(command) {
	var lex = new lexer();

	var tokens = [];

	lex.addRule(/\{[0-9]+\}/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'MACRO_ARGUMENT'
		});
	});

	lex.addRule(/[ \t\n\r]/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'WHITESPACE'
		});
	});
	lex.addRule(/username/gm, function(lexeme) {
		tokens.push({
			rawValue: stateHolder.actualUsername,
			type: 'QUOTED_STRING'
		});
	});
	lex.addRule(/echo/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'ECHO'
		});
	});
	lex.addRule(/pm/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'PM'
		});
	});
	lex.addRule(/ignore/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'IGNORE'
		});
	});
	lex.addRule(/var\(/gm, function(lexeme) {
		tokens.push({
			rawValue: 'var',
			type: 'FUNCTION'
		});
		tokens.push({
			rawValue: '(',
			type: 'LEFT_PAREN'
		});
	});
	lex.addRule(/var/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'VAR'
		});
	});
	lex.addRule(/foreach/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'FOREACH'
		});
	});
	lex.addRule(/if/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'IF'
		});
	});
	lex.addRule(/\+/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'PLUS'
		});
	});
	lex.addRule(/\-/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'MINUS'
		});
	});
	lex.addRule(/\*/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'ASTERISK'
		});
	});
	lex.addRule(/\//, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'FORWARDSLASH'
		});
	});
	lex.addRule(/\?/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'QUESTION_MARK'
		});
	});
	lex.addRule(/:/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'COLON'
		});
	});
	lex.addRule(/==/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'DOUBLE_EQUALS'
		});
	});
	lex.addRule(/</gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'LEFT_ANGLE'
		});
	});
	lex.addRule(/>/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'RIGHT_ANGLE'
		});
	});
	lex.addRule(/\!/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'EXCLAMATION'
		});
	});
	lex.addRule(/=/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'EQUALS'
		});
	});
	lex.addRule(/;/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'SEMICOLON'
		});
	});
	lex.addRule(/\(/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'LEFT_PAREN'
		});
	});
	lex.addRule(/\)/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'RIGHT_PAREN'
		});
	});
	lex.addRule(/\[/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'LEFT_BRACKET'
		});
	});
	lex.addRule(/\]/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'RIGHT_BRACKET'
		});
	});
	lex.addRule(/\{/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'LEFT_CURLY'
		});
	});
	lex.addRule(/\}/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'RIGHT_CURLY'
		});
	});
	lex.addRule(/'/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'SINGLE_QUOTE'
		});
	});
	lex.addRule(/"/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'DOUBLE_QUOTE'
		});
	});
	lex.addRule(/[0-9]+/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'NUMBER',
			value: lexeme
		});
	});
	lex.addRule(/::/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'DOUBLECOLON'
		});
	});
	lex.addRule(/[^ '"\[\(\)\t\n;]+/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'STRING'
		});
	});

	lex.setInput(command);

	try {
		lex.lex();
	} catch (e) {
		console.log(e);
	}

	tokens = fixStrings(tokens);
	tokens = removeWhitespace(tokens);
	tokens = decideStringOrVariable(tokens);
	statements = breakIntoStatementsAndBlocks(tokens);

	return statements;
}

ret.debug = function(pieces, stateHolder, next) {
	var command = '';
	for (var i = 1; i < pieces.length; i++) {
		if (command != '')
			command += ' ';
		command += pieces[i];
	}

	var commands = tokenize(command);
	stateHolder.simpleAddMessage(stateHolder.username, JSON.stringify(commands, ['rawValue', 'type'], "      "));
	return next();
}

ret.handle = function(pieces, stateHolder, next) {
	ret.stateHolder = stateHolder;

	var state = {
		variables: {},
		blockVariables: {},
		args: ('originalArgs' in stateHolder) ? stateHolder.originalArgs : pieces
	};

	var command = '';
	for (var i = 1; i < pieces.length; i++) {
		if (command != '')
			command += ' ';
		command += pieces[i];
	}

	var commands = tokenize(command);

	executeCommands(commands, state, function() {
		next();
	});
}

module.exports = ret;