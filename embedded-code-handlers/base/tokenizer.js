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
			strValue: lexeme,
			type: 'MACRO_ARGUMENT'
		});
	});

	lex.addRule(/\./gm, function(lexeme) {
		tokens.push({
			rawValue: '.',
			strValue: lexeme,
			type: 'DOT'
		});
	});
	lex.addRule(/[ \t\n\r]/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'WHITESPACE'
		});
	});
	lex.addRule(/table/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'TABLE'
		});
	});
	lex.addRule(/echo/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'ECHO'
		});
	});
	lex.addRule(/pm/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'PM'
		});
	});
	lex.addRule(/ignore/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'IGNORE'
		});
	});
	lex.addRule(/foreach/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'FOREACH'
		});
	});
	lex.addRule(/if/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'IF'
		});
	});
	lex.addRule(/else/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'ELSE'
		});
	});
	lex.addRule(/\+/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'PLUS'
		});
	});
	lex.addRule(/\-/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'MINUS'
		});
	});
	lex.addRule(/\*/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'ASTERISK'
		});
	});
	lex.addRule(/\//, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'FORWARDSLASH'
		});
	});
	lex.addRule(/\?/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'QUESTION_MARK'
		});
	});
	lex.addRule(/:/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'COLON'
		});
	});
	lex.addRule(/!=/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'NOT_EQUALS'
		});
	});
	lex.addRule(/<=/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'LE'
		});
	});
	lex.addRule(/==/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'DOUBLE_EQUALS'
		});
	});
	lex.addRule(/</gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'LEFT_ANGLE'
		});
	});
	lex.addRule(/>/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'RIGHT_ANGLE'
		});
	});
	lex.addRule(/\!/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'EXCLAMATION'
		});
	});
	lex.addRule(/=/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'EQUALS'
		});
	});
	lex.addRule(/;/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'SEMICOLON'
		});
	});
	lex.addRule(/\(/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'LEFT_PAREN'
		});
	});
	lex.addRule(/\)/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'RIGHT_PAREN'
		});
	});
	lex.addRule(/\[/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'LEFT_BRACKET'
		});
	});
	lex.addRule(/\]/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'RIGHT_BRACKET'
		});
	});
	lex.addRule(/\{/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'LEFT_CURLY'
		});
	});
	lex.addRule(/\}/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'RIGHT_CURLY'
		});
	});
	lex.addRule(/\&\&/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'BOOLEAN_AND'
		});
	});
	lex.addRule(/\|\|/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'BOOLEAN_OR'
		});
	});
	lex.addRule(/'/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'SINGLE_QUOTE'
		});
	});
	lex.addRule(/["“]/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'DOUBLE_QUOTE'
		});
	});
	lex.addRule(/[0-9]+/, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'STRING',
			value: lexeme
		});
	});
	lex.addRule(/[^ '"\[\]\.\(\)\t\n;]+/gm, function(lexeme) {
		tokens.push({
			rawValue: lexeme,
			strValue: lexeme,
			type: 'STRING'
		});
	});

	lex.setInput(command);

	try {
		lex.lex();

		fixStrings(
			tokens,
			function(error, tokensWithQuotedStrings) {
				if (error) {
					return cb(error);
				}

				removeWhitespace(
					tokensWithQuotedStrings,
					function(error, finalizedTokens) {
						if (error) {
							return cb(error);
						}

						console.log(finalizedTokens);

						return cb(null, finalizedTokens);
					}
				);
			}
		);
	} catch (e) {
		if (e.stack) {
			return cb(e.stack);
		} else {
			return cb(e);
		}
	}
}