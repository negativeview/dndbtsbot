var async          = require('async');
var CodeState      = require('./code-state.js');
var helper         = require('../helper.js');
var patterns       = require('../patterns/all.js');
var tokenizer      = require('./tokenizer.js');
var SyntaxTreeNode = require('./syntax-tree-node.js');

var patterns = [
	[
		patterns.elseBranch
	],
	[
		patterns.curlyBraces,
	],
	[
		patterns.semicolon,
	],
	[
		patterns.assignment,
		patterns.echo,
		patterns.pm,
		patterns.ignore,
		patterns.ifBranch,
		patterns.deleteNode
	],
	[
		patterns.parenthesis
	],
	[
		patterns.booleanAnd,
		patterns.booleanOr
	],
	[
		patterns.doubleEquals,
		patterns.notEquals,
		patterns.le,
		patterns.lessThan,
		patterns.greaterThan
	],
	[
		patterns.plusMinus
	],
	[
		patterns.asterisk,
		patterns.divide
	],
	[
		patterns.squareBrackets,	// before dot
	],
	[
		patterns.dot, // after square brackets
	],
	[
		patterns.foreach,
		patterns.table,
		patterns.roll,
		patterns.simpleString,
		patterns.macroArgument,
		patterns.negativeNumber
	]
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
	this.codeState = codeState;
	process.nextTick(
		() => {
			tokenizer(
				command,
				(error, tokens, parentElement) => {
					if (error) return externalCallback(error);

					process.nextTick(() => {
//						try {
							this.handleTokenList(externalCallback, codeState, null, tokens, parentElement);
//						} catch (e) {
//							return externalCallback(e);
//						}
					});
				}
			);
		}
	);
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
EmbeddedCodeHandler.prototype.handleTokenList = function(externalCallback, codeState, error, tokens, parentElement) {
	if (error) return externalCallback(error);

	if ('programNode' in codeState) {
		var stn = codeState.programNode;
	} else {
		var stn = new SyntaxTreeNode();
		stn.strRep = '<program>';
		stn.type = 'program';
		stn.tokenList = tokens;
		stn.codeHandler = this;
		codeState.programNode = stn;
	}

	this.findPattern(
		(index, pattern) => {
			process.nextTick(() => {
				this.handleTopToken(
					codeState,
					tokens,
					function(error, newNode) {
						if (error) return externalCallback(error);
						process.nextTick(() => {
							try {
								console.log('Executing ' + newNode.type);
								newNode.execute(parentElement ? parentElement : stn, codeState, externalCallback);
							} catch (e) {
								console.log('error', e.stack);
								return externalCallback(e.stack);
							}
						});
					},
					index,
					pattern
				);
			});
		},
		tokens,
		(a, b) => {
			return externalCallback(a, b);
		}
	);
};

EmbeddedCodeHandler.prototype.handleTopToken = function(codeState, tokens, cb, index, pattern) {
	//console.log('Found pattern ' + pattern.name);
	pattern.process(this, tokens, codeState, index, cb);
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
	if (tokenArray.length == 0) return next();

	for (var i = 0; i < patterns.length; i++) {
		var patternGroup = patterns[i];

		var matches = [];
		for (p = 0; p < patternGroup.length; p++) {
			var pattern = patternGroup[p];
			var found = pattern.matches(tokenArray);
			if (found !== false) {
				matches.push({pattern: pattern, index: found});
			}
		}

		if (matches.length == 1) {
			return foundCallback(matches[0].index, matches[0].pattern);
		} else if (matches.length > 1) {
			if (i == 3 || i == 5) {
				var match = null;
				for (var p = 0; p < matches.length; p++) {
					if (match == null || matches[p].index > match.index) {
						match = matches[p];
					}
				}
				if (match == null) {
					throw new Error("This should never happen.");
				}

				return foundCallback(match.index, match.pattern);
			}
			console.log('Found multiple', matches, tokenArray);
			throw new Error("Found multiple");
		}
	}

	throw new Error('No pattern found for ' + tokenArray.map(function(a) { return a.stringValue; }).join(', '));
};

EmbeddedCodeHandler.prototype.debug = function(pieces, next) {

};

module.exports = EmbeddedCodeHandler;