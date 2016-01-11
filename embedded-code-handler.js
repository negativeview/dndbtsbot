var async     = require('async');
var helper    = require('./embedded-code-handlers/helper.js');
var patterns  = require('./embedded-code-handlers/patterns/all.js');
var tokenizer = require('./embedded-code-handlers/base/tokenizer.js');
var SyntaxTreeNode = require('./embedded-code-handlers/base/syntax-tree-node.js');

var ret = {
	patterns: [
		patterns.ifElse,
		patterns.curlyBraces,
		patterns.semicolon,
		patterns.parenthesis,
		patterns.assignment,
		patterns.echo,
		patterns.ignore,
		patterns.squareBrackets,
		patterns.dot,
		patterns.table,
		patterns.doubleEquals
	]
};

ret.setHandlers = function(handlers) {
	ret.handlers = handlers;
	helper.handlers = handlers;
};

ret.setMongoose = function(mongoose) {
	ret.mongoose       = mongoose;
	ret.varModel       = mongoose.model('Var');
	ret.characterModel = mongoose.model('Character');
	ret.tableModel     = mongoose.model('Table');
	ret.tableRowModel  = mongoose.model('TableRow');
}

function handleCommandPart(commandArray, state, cb) {
	if (commandArray.length == 0) return cb();

	if (commandArray.length == 1) {
		var stn = new SyntaxTreeNode();
		stn.strRep = commandArray[0].rawValue;
		stn.node = commandArray[0];
		stn.work = function (stateHolder, state, node, cb) {
			return cb(null, stn.strRep);
		};
		return cb(null, stn);
	}

	for (var i = 0; i < ret.patterns.length; i++) {
		var pattern = ret.patterns[i];
		var found = false;
		try {
			found = pattern.matches(commandArray);
		} catch (e) {
			return cb(e.stack + " " + commandArray.toString());
		}

		if (found !== false) {
			pattern.process(
				commandArray,
				state,
				found,
				function(error, node) {
					if (error) {
						return cb(error, node);
					}

					var otherCommandPartArray = node.trees;

					async.eachSeries(
						otherCommandPartArray,
						function(index, next) {
							handleCommandPart(
								index,
								state,
								function(error, node2) {
									if (node2) {
										node.addSubNode(node2);
									}

									if (error) {
										return cb(error, node);
									}

									return next();
								}
							)
						},
						function(error) {
							return cb(error, node);
						}
					)
				}
			);
			return;
		}
	}
	var errorMessage = 'Could not figure out how to process ';
	var pieces = [];
	for (var i = 0; i < commandArray.length; i++) {
		pieces.push(commandArray[i].rawValue);
	}
	errorMessage += pieces.join(' ');

	return cb(errorMessage);
}
ret.handleCommandPart = handleCommandPart;

/***
 * handleSingleCommand
 ***/
function handleSingleCommand(stateHolder, command, state, callback) {
	var tokenLists = [command];

	handleCommandPart(
		command,
		state,
		function(
			error,
			returnedNode
		) {
			if (error) {
				var errorMessage = "SYNTAX ERROR: " + error;
				console.log(errorMessage);
				return callback(error);
			}

			returnedNode.work(stateHolder, state, returnedNode, function(error) {
				return callback(error, returnedNode);
			});
		}
	)
}

function executeCommands(stateHolder, commands, state, next) {
	for (var i = 0; i < commands.length; i++) {
		if (commands[i].type == 'MACRO_ARGUMENT') {
			var value = commands[i].rawValue;

			var matches = value.match(/{([0-9]+)\+}/);
			if (matches) {
				var strValue = '';
				for (var m = matches[1]; m < state.args.length; m++) {
					if (m != matches[1]) strValue += ' ';
					strValue += state.args[m];
				}

				commands[i] = {
					rawValue: strValue,
					type: 'QUOTED_STRING'
				};
			} else {
				matches = value.match(/{([0-9]+)}/);
				if (matches) {
					var strValue = state.args[matches[1]];
					commands[i] = {
						rawValue: strValue,
						type: 'QUOTED_STRING'
					};
				}
			}
		}
	}

	handleSingleCommand(stateHolder, commands, state, function(error, result) {
		next(error);
	});
}

ret.debug = function(pieces, stateHolder, next) {
	var command = '';
	for (var i = 1; i < pieces.length; i++) {
		if (command != '')
			command += ' ';
		command += pieces[i];
	}

	try {
		tokenizer(command, function(error, commands) {
			if (error) {
				stateHolder.simpleAddMessage(stateHolder.username, error);
				return next();
			}
			stateHolder.simpleAddMessage(stateHolder.username, JSON.stringify(commands, ['rawValue', 'type'], "      "));
			return next();
		});
		return;
	} catch (e) {
		stateHolder.simpleAddMessage(stateHolder.username, e.stack);
	}
	return next();
}

ret.handle = function(pieces, stateHolder, next) {
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
		tokenizer(command, function(error, commands) {
			if (error) {
				stateHolder.simpleAddMessage(stateHolder.username, error);
				return next();
			}
			executeCommands(stateHolder, commands, state, function(error) {
				if (error) {
					stateHolder.simpleAddMessage(stateHolder.username, error);
				}
				return next(null, state);
			});
		});
	} catch (e) {
		stateHolder.simpleAddMessage(stateHolder.username, e.stack);
		return next(null, state);
	}
	return;
}

module.exports = ret;