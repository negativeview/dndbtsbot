var lexer = require('lex');
var async = require('async');

function filterInt(value) {
  if(/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
    return Number(value);
  return NaN;
}

function doesMatch(command, matchDefinition) {
	for (var i = 0; i <= command.length - matchDefinition.length; i++) {
		var found = true;

		for (var m = 0; m < matchDefinition.length; m++) {
			if (matchDefinition[m].indexOf(command[i + m].type) == -1) {
				found = false;
				break;
			} 
		}

		if (found) return i;
	}

	return false;
}

var ret = {
	patterns: [
		{ name: 'Channel variable',
			matches: function(command) {
				return doesMatch(
					command,
					[
						['CHANNEL_VARIABLE']
					]
				);
			},
			work: function(stateHolder, index, command, state, cb) {
				var tmpCommand = [];
				for (var i = 0; i < index; i++) {
					tmpCommand.push(command[i]);
				}

				var internalCommand = [
					'!var',
					'get',
					'channel',
					command[index].rawValue.substring(1)
				];
				ret.handlers.execute(
					'!var',
					internalCommand,
					ret.fakeStateHolder,
					function() {
						tmpCommand.push({
							type: 'QUOTED_STRING',
							rawValue: ret.fakeStateHolder.result
						});

						for (var i = index + 1; i < command.length; i++) {
							tmpCommand.push(command[i]);
						}
						return cb(tmpCommand);
					}
				);
			}
		},
		{ name: 'Table lookup',
			matches: function(command) {
				return doesMatch(
					command,
					[
						['VARIABLE'],
						['LEFT_BRACKET'],
						['QUOTED_STRING', 'NUMBER', 'VARIABLE'],
						['RIGHT_BRACKET']
					]
				);
			},
			work: function(stateHolder, index, command, state, cb) {
				var tmpCommand = [];
				for (var i = 0; i < index; i++) {
					tmpCommand.push(command[i]);
				}

				var key = command[i + 2].rawValue;
				if (command[i + 2].type == 'VARIABLE') {
					key = state.variables[key];
				}

				var internalCommand = [
					'!table',
					'get',
					'me',
					command[i].rawValue,
					key
				];

				ret.handlers.execute(
					'!table',
					internalCommand,
					ret.fakeStateHolder,
					function() {
						tmpCommand.push({
							type: 'QUOTED_STRING',
							rawValue: ret.fakeStateHolder.result
						});

						for (var i = index + 4; i < command.length; i++) {
							tmpCommand.push(command[i]);
						}
						return cb(tmpCommand);
					}
				);
			}
		},
		{ name: 'Echo something',
			matches: function(command) {
				return doesMatch(
					command,
					[
						['ECHO'],
						['QUOTED_STRING', 'VARIABLE', 'NUMBER'],
						['SEMICOLON']
					]
				);
			},
			work: function(stateHolder, index, command, state, cb) {
				ret.stateHolder.simpleAddMessage(
					ret.stateHolder.channelID,
					command[1].type == 'VARIABLE' ?
						state.variables[command[1].rawValue] :
						command[1].rawValue
				);
				return cb([]);
			}
		},
		{ name: 'Ignore something',
			matches: function(command) {
				return doesMatch(
					command,
					[
						['IGNORE'],
						['QUOTED_STRING', 'VARIABLE', 'NUMBER'],
						['SEMICOLON']
					]
				);
			},
			work: function(stateHolder, index, command, state, cb) {
				return cb([]);
			}
		},
		{ name: 'Function execution',
			matches: function(command) {
				return doesMatch(
					command,
					[
						['FUNCTION'],
						['LEFT_PAREN'],
						['QUOTED_STRING', 'VARIABLE'],
						['RIGHT_PAREN']
					]
				);
			},
			work: function(stateHolder, index, command, state, cb) {
				var commandName = command[index].rawValue;
				var argument = command[index + 2].type == 'VARIABLE' ? state.variables[command[index + 2].rawValue] : command[index + 2].rawValue;

				var tmpCommand = [];
				for (var i = 0; i < index; i++) {
					tmpCommand.push(command[i]);
				}

				var internalCommand = [
					'!' + commandName,
				];

				var arguments = argument.split(" ");
				for (var i = 0; i < arguments.length; i++) {
					internalCommand.push(arguments[i]);
				}

				ret.handlers.execute(
					'!' + commandName,
					internalCommand,
					ret.fakeStateHolder,
					function() {
						tmpCommand.push({
							type: 'QUOTED_STRING',
							rawValue: ret.fakeStateHolder.result
						});

						for (var i = index + 4; i < command.length; i++) {
							tmpCommand.push(command[i]);
						}

						return cb(tmpCommand);
					}
				);
			}
		},
		{ name: 'Squash parens',
			matches: function(command) {
				var res = doesMatch(
					command,
					[
						['LEFT_PAREN'],
						['CHANNEL_VARIABLE', 'VARIABLE', 'QUOTED_STRING', 'NUMBER'],
						['RIGHT_PAREN']
					]
				);
				return res;
			},
			work: function(stateHolder, index, command, state, cb) {
				var tmpCommand = [];
				for (var i = 0; i < index; i++) {
					tmpCommand.push(command[i]);
				}

				tmpCommand.push(command[index + 1]);
				
				for (var i = index + 3; i < command.length; i++) {
					tmpCommand.push(command[i]);
				}
				return cb(tmpCommand);
			}
		},
		{ name: 'String plus variable',
			matches: function(command) {
				return doesMatch(
					command,
					[
						['VARIABLE', 'QUOTED_STRING', 'NUMBER'],
						['PLUS'],
						['QUOTED_STRING', 'VARIABLE', 'NUMBER']
					]
				);
			},
			work: function(stateHolder, index, command, state, cb) {
				var val1 = command[index].rawValue;
				var val2 = command[index + 2].rawValue;

				if (command[index].type == 'VARIABLE') val1 = state.variables[val1];
				if (command[index + 2].type == 'VARIABLE') val2 = state.variables[val2];

				var tmpCommand = [];
				for (var i = 0; i < index; i++) {
					tmpCommand.push(command[i]);
				}
				if (!isNaN(filterInt(val1)) && !isNaN(filterInt(val2))) {
					tmpCommand.push(
					{
						type: 'NUMBER',
						rawValue: filterInt(val1) + filterInt(val2)
					});
				} else {
					tmpCommand.push(
					{
						type: 'QUOTED_STRING',
						rawValue: val1 + val2
					});
				}
				for (var i = index + 3; i < command.length; i++) {
					tmpCommand.push(command[i]);
				}

				return cb(tmpCommand);
			}
		},
		{ name: 'Variable Assignment',
			matches: function(command) {
				if (command.length != 5 && command.length != 4) return false;
				if (command.length == 5 && command[0].type != 'VAR') return false;

				var offset = 0;
				if (command.length == 5) offset = 1;

				if (command[offset + 0].type != 'VARIABLE') return false;
				if (command[offset + 1].type != 'EQUALS') return false;
				if (command[offset + 2].type != 'QUOTED_STRING' && command[offset + 2].type != 'NUMBER') return false;
				if (command[offset + 3].type != 'SEMICOLON') return false;

				return offset;
			},
			work: function(stateHolder, index, command, state, cb) {
				state.variables[command[index + 0].rawValue] = command[index + 2].rawValue;

				return cb([]);
			}
		},
		{ name: 'Macro arguments',
			matches: function(command) {
				return doesMatch(
					command,
					[
						['LEFT_CURLY'],
						['NUMBER', 'STRING'],
						['RIGHT_CURLY']
					]
				);
			},
			work: function(stateHolder, index, command, state, cb) {
				var tmpCommand = [];
				for (var i = 0; i < index; i++) {
					tmpCommand.push(command[i]);
				}
				tmpCommand.push({
					type: 'QUOTED_STRING',
					rawValue: state.args[command[index+1].rawValue]
				});
				for (var i = index + 3; i < command.length; i++) {
					tmpCommand.push(command[i]);
				}
				return cb(tmpCommand);
			}
		}
	]
};

ret.setHandlers = function(handlers) {
	ret.handlers = handlers;
};

function handleSingleCommand(stateHolder, command, state, callback) {
	if (command.length == 0) return callback(command);

	console.log(command);

	for (var i = 0; i < ret.patterns.length; i++) {
		var pattern = ret.patterns[i];
		var found = pattern.matches(command);
		if (found !== false) {
			pattern.work(stateHolder, found, command, state, function(newCommand) {
				console.log(pattern.name);
				handleSingleCommand(stateHolder, newCommand, state, callback);
			});
			return;
		} else {
			console.log("Not: " + pattern.name);
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
	// Fix strings
	var workingCommands = [];

	// Pull quoted strings into their own token.
	for (var i = 0; i < commands.length; i++) {
		var command = commands[i];
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
		workingCommands.push(workingCommand);
	}

	commands = workingCommands;
	workingCommands = [];

	// Now we can remove all the whitespace.
	for (var i = 0; i < commands.length; i++) {
		var command = commands[i];
		var workingCommand = [];
		for (var m = 0; m < command.length; m++) {
			var token = command[m];
			if (token.type != 'WHITESPACE') {
				workingCommand.push(token);
			}
		}
		workingCommands.push(workingCommand);
	}

	commands = workingCommands;
	workingCommands = [];

	for (var i = 0; i < commands.length; i++) {
		var command = commands[i];
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
					if (token.rawValue[0] == '#') {
						token = {
							rawValue: token.rawValue,
							type: 'CHANNEL_VARIABLE'
						};
					} else {
						token = {
							rawValue: token.rawValue,
							type: 'VARIABLE'
						};
					}
					workingCommand.push(token);
				}
			} else {
				workingCommand.push(token);
			}
		}
		workingCommands.push(workingCommand);
	}

	commands = workingCommands;
	async.eachSeries(
		commands,
		function(iterator, callback) {
			var temporaryStateHolder = ret.stateHolder.clone();
			temporaryStateHolder.isTemporary = true;

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

ret.handle = function(pieces, stateHolder, next) {
	var lex = new lexer();

	ret.stateHolder = stateHolder;
	ret.fakeStateHolder = Object.create(stateHolder);
	ret.fakeStateHolder.simpleAddMessage = function(to, message) {
		ret.fakeStateHolder.result = message;
	};

	var state = {
		variables: {},
		args: ('originalArgs' in stateHolder) ? stateHolder.originalArgs : pieces
	};

	var command = '';
	for (var i = 1; i < pieces.length; i++) {
		if (command != '')
			command += ' ';
		command += pieces[i];
	}
	console.log('Input code from user:' + "\n" + command);

	var tokens = [];

	var currentCommand = [];
	var commands = [];

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
	lex.addRule(/=/, function(lexeme) {
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
		commands.push(tokens);
		tokens = [];
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

		executeCommands(commands, state, function() {
			next();
		});
	} catch (e) {
		return next();
	}
}

module.exports = ret;