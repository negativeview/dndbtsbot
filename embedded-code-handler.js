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
	patterns.doubleEquals,
	patterns.simpleString
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
EmbeddedCodeHandler.prototype.handle = function(pieces, stateHolder, next) {
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
	/**
	 * Set up our CodeState object, which handles things like input
	 * arguments, the current code stack, etc.
	 */
	var codeState = new CodeState();
	if (this.stateHolder.incomingVariables)
		codeState.addVariables(stateHolder.incomingVariables);

	if ('originalArgs' in this.stateHolder) {
		codeState.setArguments(this.stateHolder.originalArgs);
	} else {
		codeState.setArguments(command.split(" "));
	}

	// Run the tokenizer and pass the result of that to further steps.
	try {
		tokenizer(
			command,
			this.handleTokenList.bind(
				this,
				next,
				codeState
			)
		);
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
	if (error) return cb(error);

	var stn = new SyntaxTreeNode();
	stn.strRep = '<program>';
	stn.type = 'program';
	stn.tokenList = tokens;

	this.recursiveProcess(stn, codeState, this.executeProcessed.bind(this, cb, codeState, stn));
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
			return executeCallback(null, syntaxTreeNode);
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
			return foundCallback(found, pattern);
		}
	}

	return next();
};

EmbeddedCodeHandler.prototype.executeProcessed = function(cb, state, topLevelNode, error, lastNodeProcessed) {
	topLevelNode.work(this.stateHolder, state, topLevelNode, function() {
		return cb();
	});
};

EmbeddedCodeHandler.prototype.processSingle = function(executeCallback, parentNode, state, index, pattern) {
	var recursive = function(a, b, c) {
		this.recursiveProcess(a, b, c);
	};
	recursive = recursive.bind(this);

	pattern.process(parentNode, state, index, function(error, newNode) {
		async.eachSeries(
			parentNode.nodes,
			function(index, next) {
				if (index.type == 'unparsed-node-list' && index.tokenList.length) {
					recursive(index, state, function(error) {
						if (error) console.log('error', error);
						next();
					});
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

module.exports = EmbeddedCodeHandler;