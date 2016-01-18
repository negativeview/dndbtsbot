var async          = require('async');
var CodeState      = require('./code-state.js');
var helper         = require('../helper.js');
var patterns       = require('../patterns/all.js');
var tokenizer      = require('./tokenizer.js');
var SyntaxTreeNode = require('./syntax-tree-node.js');

var patterns = [
	patterns.curlyBraces,
	patterns.ifElse,
	patterns.semicolon,
	patterns.echo,
	patterns.parenthesis,
	patterns.assignment,
	patterns.plus,
	patterns.booleanAnd,
	
	patterns.ignore,
	patterns.doubleEquals,
	patterns.notEquals,
	patterns.squareBrackets,
	patterns.dot,
	patterns.table,
	patterns.simpleString,
	patterns.macroArgument,
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
 * Handles code that is set up as an array of words.
 *
 * This function is intended to be the gateway between the old system, which
 * splits everything into arrays of words, and the new system which doesn't.
 * For that reason, this function also sets up a CodeState object, which the
 * old system knows nothing about. It then passes everything on to
 * `executeString`, which does all the actual work.
 *
 * `pieces`
 *    An array of strings that represent the program itself.
 *
 * `stateHolder`
 *    The global stateHolder that is used by a huge amount of code in this bot.
 *
 * `externalCallback`
 *    The callback to call when this is done executing. The callback takes the
 *    following arguments:
 *
 *    `error`
 *       Either null, or an error message meant ot be displayed to the end user.
 *    `codeState`
 *       The state of the internal execution environment. Using this, you can
 *       tell what the various local variables are, making it feasible to use
 *       EmbededCodeHandler as an extension mechanism.
 *****/
EmbeddedCodeHandler.prototype.handle = function(pieces, stateHolder, externalCallback) {
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

	/**
	 * Set up our CodeState object, which handles things like input
	 * arguments, the current code stack, etc.
	 */
	var codeState = new CodeState();
	if (this.stateHolder.incomingVariables)
		codeState.addVariables(this.stateHolder.incomingVariables);

	if ('originalArgs' in this.stateHolder) {
		codeState.setArguments(this.stateHolder.originalArgs);
	} else {
		codeState.setArguments(command.split(" "));
	}

	this.executeString(command, codeState, externalCallback);
};

/*****
 * Handles code that is set up as just a string.
 *
 * This function is where we actually kick off executing code. It expects code
 * to be in a sensible string by now.
 *
 * `command`
 *    The string that is the code.
 *
 * `codeState`
 *    A CodeState instance that represents the state of the virtual machine. As
 *    an input it can pre-define local variables or set the arguments that the
 *    code will see as being passed.
 *
 * `externalCallback`
 *    The callback to call when this is done executing. The callback takes the
 *    following arguments:
 *
 *    `error`
 *       Either null, or an error message meant ot be displayed to the end user.
 *    `codeState`
 *       The state of the internal execution environment. Using this, you can
 *       tell what the various local variables are, making it feasible to use
 *       EmbededCodeHandler as an extension mechanism.
 *****/
EmbeddedCodeHandler.prototype.executeString = function(command, codeState, externalCallback) {
	// Run the tokenizer and pass the result of that to further steps.
	try {
		tokenizer(
			command,
			this.handleTokenList.bind(
				this,
				externalCallback,
				codeState
			)
		);
	} catch (e) {
		return externalCallback(e.stack);
	}
};

/*****
 * Kicks off the process of turning a token list into a syntax tree and
 * executing it.
 *
 * `externalCallback`
 *    The callback to call when this is done executing. The callback takes the
 *    following arguments:
 *
 *    `error`
 *       Either null, or an error message meant ot be displayed to the end user.
 *    `codeState`
 *       The state of the internal execution environment. Using this, you can
 *       tell what the various local variables are, making it feasible to use
 *       EmbededCodeHandler as an extension mechanism.
 * `codeState`
 *    A CodeState instance that represents the state of the virtual machine. As
 *    an input it can pre-define local variables or set the arguments that the
 *    code will see as being passed.
 * `error`
 *    This function is primarily called as the callback from something else.
 *    This argument is either null or the error that that function generated.
 *    We should bail early if this is set to an error message.
 * `tokens`
 *    An array of parsed tokens.
 *****/
EmbeddedCodeHandler.prototype.handleTokenList = function(externalCallback, codeState, error, tokens) {
	if (error) return externalCallback(error);

	var stn = new SyntaxTreeNode();
	stn.strRep = '<program>';
	stn.type = 'program';
	stn.tokenList = tokens;

	this.recursiveProcess(
		stn,
		codeState,
		this.executeProcessed.bind(
			this,
			externalCallback,
			codeState,
			stn
		)
	);
};

/*****
 * Takes a SyntaxTreeNode and processes it and its children.
 *
 * `syntaxTreeNode`
 *    The SyntaxTreeNode that we want to start our processing with.
 * `codeState`
 *    A CodeState instance that represents the state of the virtual machine. As
 *    an input it can pre-define local variables or set the arguments that the
 *    code will see as being passed.
 * `executeCallback`
 *    What to call when we are done creating the syntax tree and want to
 *    execute it instead. The callback takes the following arguments:
 *    `error`
 *       The error that may hvae been generated from the previous step.
 *    `lastNodeProcessed`
 *       The last node that was processed. If an error was generated, this will
 *       be the node that generated the error. Otherwise, it's still the last
 *       node processed, but that's less important to know if there's no error.
 *****/
EmbeddedCodeHandler.prototype.recursiveProcess = function(syntaxTreeNode, codeState, executeCallback) {
	if (!syntaxTreeNode.tokenList) return executeCallback();

	if (typeof(executeCallback) != 'function') throw Error('not a function');
	this.findPattern(
		this.processSingle.bind(
			this,
			executeCallback,
			syntaxTreeNode,
			codeState
		),
		syntaxTreeNode.tokenList,
		function(error) {
			return executeCallback(error, syntaxTreeNode);
		}
	);
};

/*****
 * Takes a tokenArray find tries to find what pattern applies to it.
 *
 * This is a BIG part of turning a token array into a syntax tree node.
 *
 * `foundCallback`
 *    What to call when we find an appropriate pattern. The callback takes the
 *    following arguments:
 *       `index`
 *          The index into the tokenArray where the pattern starts.
 *       `pattern`
 *          The pattern that we found.
 * `tokenArray`
 *    An array of tokens that we are looking for patterns in.
 * `next`
 *    Call when we are done.
 *       `error`
 *          Any errors that were generated.
 *****/
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

/*****
 * Takes a fully processed syntax tree node and executes it.
 *
 * This is actually conceptually very simple. We simply call `work` on the top
 * node and it should tell its children to execute in the approrpiate order and
 * manner depending on what that node represents. The nodes are doing all the
 * work here.
 *
 * `externalCallback`
 *    The callback to call when this is done executing. The callback takes the
 *    following arguments:
 *
 *    `error`
 *       Either null, or an error message meant ot be displayed to the end user.
 *    `codeState`
 *       The state of the internal execution environment. Using this, you can
 *       tell what the various local variables are, making it feasible to use
 *       EmbededCodeHandler as an extension mechanism.
 * `codeState`
 *    A CodeState instance that represents the state of the virtual machine. As
 *    an input it can pre-define local variables or set the arguments that the
 *    code will see as being passed.
 * `topLevelNode`
 *    The SyntaxTreeNode that is the very very top level node.
 * `error`
 *    null if there's no error, or a string representing the error.
 * `lastNodeProcessed`
 *    The last node that was processed. If there was an erorr, this should be
 *    the node most closely associated with the error.
 *****/
EmbeddedCodeHandler.prototype.executeProcessed = function(externalCallback, codeState, topLevelNode, error, lastNodeProcessed) {
	if (error) {
		return externalCallback(error);
	}
	
	console.log('TOP LEVEL NODE', JSON.stringify(topLevelNode, ['type', 'strRep', 'nodes', 'tokenList', 'rawValue'], '  '));
	topLevelNode.work(this.stateHolder, codeState, topLevelNode, function(error) {
		return externalCallback(error, codeState);
	});
};

EmbeddedCodeHandler.prototype.processSingle = function(doneProcessing, parentNode, codeState, index, pattern) {
	if (typeof(doneProcessing) != 'function') throw Error('not a function');

	try {
		pattern.process(
			parentNode,
			codeState,
			index,
			this._processSingleDone.bind(this, parentNode, doneProcessing, codeState)
		);
	} catch (e) {
		console.log('Error I am trying to pass back', e);
		return this._processSingleDone(parentNode, doneProcessing, codeState, e.stack);
	}
};

EmbeddedCodeHandler.prototype._processSingleDone = function(parentNode, doneProcessing, codeState, error, newNode) {
	if (error) { return doneProcessing(error); }
	if (typeof(doneProcessing) != 'function') throw Error('not a function');
	async.eachSeries(
		parentNode.nodes,
		this._executeSingleChild.bind(
			this,
			this.recursiveProcess.bind(this),
			codeState
		),
		function(error) {
			return doneProcessing(error, codeState)
		}
	);
}

EmbeddedCodeHandler.prototype._executeSingleChild = function(recursive, codeState, index, next) {
	if (index.type == 'unparsed-node-list' && index.tokenList.length) {
		recursive(index, codeState, function(error) {
			return next(error);
		});
	} else {
		return next();
	}
};

EmbeddedCodeHandler.prototype.debug = function(pieces, next) {

};

module.exports = EmbeddedCodeHandler;