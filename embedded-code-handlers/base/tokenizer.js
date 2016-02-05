/**
 * The tokenizer takes the raw input and turns it into tokens. If this does not
 * work, you essentially have a compile-time error.
 *
 * Most of this file is simple defining what a token looks like and giving the
 * token a name.
 */

var fixStrings       = require('./fix-strings.js');
var lexer            = require('lex');
var removeWhitespace = require('./remove-whitespace.js');

module.exports = function(command, cb) {
	var lex = new lexer();

	var tokens = [];

	lex.addRule(/\{[0-9]+\+?\}/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'MACRO_ARGUMENT'
		});
	});

	lex.addRule(/\./gm, function(lexeme) {
		tokens.push({
			rawValue: '.',
			stringValue: lexeme,
			type: 'DOT'
		});
	});
	lex.addRule(/[ \t\n\r]/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'WHITESPACE'
		});
	});
	lex.addRule(/\+/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'PLUS'
		});
	});
	lex.addRule(/\-/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'MINUS'
		});
	});
	lex.addRule(/\*/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'ASTERISK'
		});
	});
	lex.addRule(/\//, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'FORWARDSLASH'
		});
	});
	lex.addRule(/\?/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'QUESTION_MARK'
		});
	});
	lex.addRule(/:/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'COLON'
		});
	});
	lex.addRule(/!=/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'NOT_EQUALS'
		});
	});
	lex.addRule(/<=/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'LE'
		});
	});
	lex.addRule(/==/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'DOUBLE_EQUALS'
		});
	});
	lex.addRule(/</gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'LEFT_ANGLE'
		});
	});
	lex.addRule(/>/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'RIGHT_ANGLE'
		});
	});
	lex.addRule(/\!/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'EXCLAMATION'
		});
	});
	lex.addRule(/=/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'EQUALS'
		});
	});
	lex.addRule(/;/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'SEMICOLON'
		});
	});
	lex.addRule(/\(/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'LEFT_PAREN'
		});
	});
	lex.addRule(/\)/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'RIGHT_PAREN'
		});
	});
	lex.addRule(/\[/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'LEFT_BRACKET'
		});
	});
	lex.addRule(/\]/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'RIGHT_BRACKET'
		});
	});
	lex.addRule(/\{/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'LEFT_CURLY'
		});
	});
	lex.addRule(/\}/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'RIGHT_CURLY'
		});
	});
	lex.addRule(/\&\&/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'BOOLEAN_AND'
		});
	});
	lex.addRule(/\|\|/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'BOOLEAN_OR'
		});
	});
	lex.addRule(/'/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'SINGLE_QUOTE'
		});
	});
	lex.addRule(/["“]/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'DOUBLE_QUOTE'
		});
	});
	lex.addRule(/[0-9]+/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			stringValue: lexeme,
			type: 'BARE_STRING',
			value: lexeme
		});
	});
	lex.addRule(/[^ '"\[\]\.\(\)\t\n\{\};]+/gm, function(lexeme) {
		switch (lexeme) {
			case 'roll':
				tokens.push({
					rawValue: lexeme,
					stringValue: lexeme,
					type: 'ROLL'
				});
				break;
			case 'else':
				tokens.push({
					rawValue: lexeme,
					stringValue: lexeme,
					type: 'ELSE'
				});
				break;
			case 'ignore':
				tokens.push({
					rawValue: lexeme,
					stringValue: lexeme,
					type: 'IGNORE'
				});
				break;
			case 'foreach':
				tokens.push({
					rawValue: lexeme,
					stringValue: lexeme,
					type: 'FOREACH'
				});
				break;
			case 'if':
				tokens.push({
					rawValue: lexeme,
					stringValue: lexeme,
					type: 'IF'
				});
				break;
			case 'table':
				tokens.push({
					rawValue: lexeme,
					stringValue: lexeme,
					type: 'TABLE'
				});
				break;
			case 'echo':
				tokens.push({
					rawValue: lexeme,
					stringValue: lexeme,
					type: 'ECHO'
				});
				break;
			case 'pm':
				tokens.push({
					rawValue: lexeme,
					stringValue: lexeme,
					type: 'PM'
				});
				break;
			default:
				tokens.push({
					rawValue: lexeme,
					stringValue: lexeme,
					type: 'BARE_STRING'
				});
		}
	});

	lex.setInput(command);

	lex.lex();

	fixStrings(
		tokens,
		(error, tokensWithQuotedStrings) => {
			if (error) {
				return cb(error);
			}

			process.nextTick(() => {
				removeWhitespace(
					tokensWithQuotedStrings,
					(error, finalizedTokens) => {
						if (error) {
							return cb(error);
						}

						process.nextTick(() => {
							cb(null, finalizedTokens);
						});
					}
				);
			});
		}
	);
}