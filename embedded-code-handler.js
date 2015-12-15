var lexer = require('lex');
var async = require('async');

function filterInt(value) {
  if(/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
    return Number(value);
  return NaN;
}

var ret = {
	patterns: [
		{ name: 'Table lookup',
			matches: function(command) {
				for (var i = 0; i < command.length - 3; i++) {
					var token = command[i];
					if (token.type == 'VARIABLE') {
						if (command[i + 1].type == 'LEFT_BRACKET') {
							if (command[i + 2].type == 'QUOTED_STRING' || command[i + 2].type == 'NUMBER' || command[i + 2].type == 'VARIABLE') {
								if (command[i + 3].type == 'RIGHT_BRACKET') {
									return i;
								}
							}
						}
					}
				}
				return false;				
			},
			work: function(index, command, state, cb) {
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
				for (var i = 0; i < command.length - 2; i++) {
					var token = command[i];
					if (token.type == 'ECHO') {
						if (command[i + 1].type == 'QUOTED_STRING' || command[i + 1].type == 'VARIABLE' || command[i + 1].type == 'NUMBER') {
							if (command[i + 2].type == 'SEMICOLON') {
								return i;
							}
						}
					}
				}
				return false;
			},
			work: function(index, command, state, cb) {
				ret.stateHolder.simpleAddMessage(ret.stateHolder.channelID, command[1].rawValue);
				return cb([]);
			}
		},
		{ name: 'Function execution',
			matches: function(command) {
				for (var i = 0; i < command.length - 4; i++) {
					var token = command[i];
					if (token.type == 'FUNCTION') {
						if (command[i + 1].type == 'LEFT_PAREN') {
							if (command[i + 2].type == 'QUOTED_STRING' || command[i + 2].type == 'VARIABLE') {
								if (command[i + 3].type == 'RIGHT_PAREN') {
									return i;
								}
							}
						}
					}
				}
				return false;
			},
			work: function(index, command, state, cb) {
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
		{ name: 'String plus variable',
			matches: function(command) {
				for (var i = 0; i < command.length - 3; i++) {
					var token = command[i];
					if (token.type == 'VARIABLE' || token.type == 'QUOTED_STRING') {
						if (command[i + 1].type == 'PLUS') {
							if (command[i + 2].type == 'QUOTED_STRING' || command[i + 2].type == 'VARIABLE') {
								return i;
							}
						}
					}
				}
				return false;
			},
			work: function(index, command, state, cb) {
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
			work: function(index, command, state, cb) {
				state.variables[command[index + 0].rawValue] = command[index + 2].rawValue;

				return cb([]);
			}
		},
		{ name: 'Macro arguments',
			matches: function(command) {
				for (var i = 0; i < command.length - 2; i++) {
					var token = command[i];
					if (token.type == 'LEFT_CURLY') {
						if (command[i + 1].type == 'NUMBER' || command[i + 1].type == 'STRING') {
							if (command[i + 2].type == 'RIGHT_CURLY') {
								return i;
							}
						}
					}
				}
				return false;
			},
			work: function(index, command, state, cb) {
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

function handleSingleCommand(command, state, callback) {
	if (command.length == 0) return callback(command);

	console.log(command);

	for (var i = 0; i < ret.patterns.length; i++) {
		var pattern = ret.patterns[i];
		var found = pattern.matches(command);
		if (found !== false) {
			pattern.work(found, command, state, function(newCommand) {
				handleSingleCommand(newCommand, state, callback);
			});
			return;
		}
	};

	ret.stateHolder.simpleAddMessage(ret.stateHolder.username, 'Got to end of command without being able to process it completely. Here\'s what\'s left:');
	for (var i = 0; i < command.length; i++) {
		ret.stateHolder.simpleAddMessage(ret.stateHolder.username, "\n");
		ret.stateHolder.simpleAddMessage(ret.stateHolder.username, command[i].type + ': ' + command[i].toString());
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
					token = {
						rawValue: token.rawValue,
						type: 'VARIABLE'
					};
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
			handleSingleCommand(iterator, state, function(result) {
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
	lex.addRule(/echo/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'ECHO'
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
	lex.addRule(/[a-z]+/i, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			type: 'STRING'
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

	lex.setInput(command);

	try {
		lex.lex();

		executeCommands(commands, state, function() {
			console.log('got to end:');
			console.log(state);
			next();
		});
	} catch (e) {
		return next();
	}
}

module.exports = ret;