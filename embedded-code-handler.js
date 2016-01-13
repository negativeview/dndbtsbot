var async          = require('async');
var CodeState      = require('./embedded-code-handlers/base/code-state.js');
var helper         = require('./embedded-code-handlers/helper.js');
var patterns       = require('./embedded-code-handlers/patterns/all.js');
var tokenizer      = require('./embedded-code-handlers/base/tokenizer.js');
var SyntaxTreeNode = require('./embedded-code-handlers/base/syntax-tree-node.js');

var patterns = [
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
];

function EmbeddedCodeHandler(stateHolder, handlerRegistry) {
	this.stateHolder = stateHolder;
	this.mongoose = stateHolder.mongoose;
	this.varModel = this.mongoose.model('Var');
	this.characterModel = this.mongoose.model('Character');
	this.tableModel = this.mongoose.model('Table');
	this.tableRowModel = this.mongoose.model('TableRow');
	this.handlers = handlerRegistry;
};

/*****
 * `handle` is the highest level function that is called from the old system
 * when it wants to execute a program. It handles converting between the more
 * primitive system and the more advanced. It doesn't actually DO much past
 * that.
 *****/
EmbeddedCodeHandler.prototype.handle = function(pieces, next) {
	/**
	 * Re-build the command. Because it came through the older stupid
	 * system it's an array of words split on spaces. Put them back
	 * together.
	 */
	var command = '';
	for (var i = 1; i < pieces.length; i++) {
		if (command != '')
			command += ' ';
		command += pieces[i];
	}

	this.executeString(command, next);
};

/*****
 * `executeString` is the highest level function that actually DOES things.
 * This is usually called via `handle`, because we usually call this via the
 * more primitive codebase.
 *****/
EmbeddedCodeHandler.prototype.executeString = function(command, next) {
	console.log('executeString:', command);

	/**
	 * Set up our CodeState object, which handles things like input
	 * arguments, the current code stack, etc.
	 */
	var codeState = new CodeState();
	if (this.stateHolder.incomingVariables)
		codeState.addVariables(stateHolder.incomingVariables);

	if ('originalArgs' in this.stateHolder) {
		codeState.setArguments(stateHolder.originalArgs);
	} else {
		codeState.setArguments(command.split(" "));
	}

	// Run the tokenizer and pass the result of that to further steps.
	try {
		tokenizer(command, this.handleTokenList.bind(this, next, codeState));
	} catch (e) {
		return next(e.stack);
	}
};

/*****
 * This function takes a list of tokens that have been tokenized and creates
 * the highest level syntax tree node then sets off the recursive parsing. This
 * recursive processing is largely handled by `recursiveProcess`. This function
 * passes `executeProcessed` to recursiveProcess to set up what happens to the
 * processed tree.
 *****/
EmbeddedCodeHandler.prototype.handleTokenList = function(cb, codeState, error, tokens) {
	console.log('handleTokenList');
	if (error) return cb(error);

	var stn = new SyntaxTreeNode();
	stn.strRep = '<program>';
	stn.type = 'program';
	stn.tokenList = tokens;

	this.recursiveProcess(stn, codeState, this.executeProcessed.bind(this, cb));
};

/*****
 * 
 *****/
EmbeddedCodeHandler.prototype.recursiveProcess = function(syntaxTreeNode, codeState, executeCallback) {
	if (!syntaxTreeNode.tokenList) return executeCallback();

	this.findPattern(
		this.processSingle.bind(
			this,
			executeCallback,
			syntaxTreeNode,
			codeState
		),
		syntaxTreeNode.tokenList,
		function() {
			console.log('in callback', syntaxTreeNode);
			return executeCallback(syntaxTreeNode);
		}
	);
};

EmbeddedCodeHandler.prototype.findPattern = function(foundCallback, tokenArray, next) {
	for (var i = 0; i < patterns.length; i++) {
		var pattern = patterns[i];
		var found = false;
		try {
			found = pattern.matches(tokenArray);
		} catch (e) {
			return next(e.stack);
		}

		if (found !== false) {
			console.log('!!foundPattern:', pattern.name);
			return foundCallback(found, pattern);
		} else {
			console.log('Not found:', pattern.name);
		}
	}

	return next();
};

EmbeddedCodeHandler.prototype.executeProcessed = function(cb, error, topLevelNode) {
	console.log('executeProcessed', error);
	console.log(JSON.stringify(topLevelNode, ['type', 'strRep', 'nodes'], '  '));
	return cb();
};

EmbeddedCodeHandler.prototype.processSingle = function(executeCallback, parentNode, state, index, pattern) {
	var recursive = this.recursiveProcess.bind(this);

	pattern.process(parentNode, state, index, function(error, newNode) {
		async.eachSeries(
			parentNode.nodes,
			function(index, next) {
				if (index.type == 'unparsed-node-list' && index.tokenList.length) {
					recursive(index, state, next);
				} else {
					return next();
				}
			},
			function(error) {
				return executeCallback(error);
			}
		);
	});
};

EmbeddedCodeHandler.prototype.debug = function(pieces, next) {

};

/*

function findPattern(commandArray, cb) {
	for (var i = 0; i < ret.patterns.length; i++) {
		var pattern = ret.patterns[i];
		var found = false;
		try {
			found = pattern.matches(commandArray);
		} catch (e) {
			return cb(e.stack);
		}

		if (found !== false) {
			return cb(null, found, pattern);
		}
	}

	return cb();
}

function handleCommandPart(commandArray, node, state, cb) {
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

	findPattern(commandArray, function(err, found, pattern) {
		if (err) return cb(err);
		if (!pattern) {
			var errorMessage = 'Could not figure out how to process ';
			var pieces = [];
			for (var i = 0; i < commandArray.length; i++) {
				pieces.push(commandArray[i].rawValue);
			}
			errorMessage += pieces.join(' ');

			return cb(errorMessage);
		}

		pattern.process(
			commandArray,
			node,
			state,
			found,
			function(error, node2) {
				if (error) {
					return cb(error, node2);
				}

				node.addSubNode(node2);

				async.eachSeries(
					node2.trees,
					function(index, next) {
						handleCommandPart(
							index,
							node2,
							state,
							function(error, stn) {
								if (error) return cb(error);

								node2.addSubNode(stn);

								return next();
							}
						);
					},
					function() {
						return cb(null, node);
					}
				);
			}
		);
	});
}
ret.handleCommandPart = handleCommandPart;

function handleSingleCommand(stateHolder, command, state, callback) {
	var tokenLists = [command];

	var stn = new SyntaxTreeNode();
	stn.strRep = '<program>';

	handleCommandPart(
		command,
		stn,
		state,
		function(
			error,
			returnedNode
		) {
			if (error) {
				return callback(error);
			}

			console.log(JSON.stringify(returnedNode, ["strRep", "type", "nodes"], "  "));

			async.eachSeries(
				returnedNode.nodes,
				function(index, next) {
					index.work(stateHolder, state, index, function(error) {
						return next(error);
					});
				},
				function(error) {
					return callback(error, stn);
				}
			);
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
*/

module.exports = EmbeddedCodeHandler;