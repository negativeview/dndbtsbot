var tokenizer = require('../embedded-code-handlers/base/tokenizer.js');

module.exports.testSimpleString = function(test) {
	test.expect(5);
	tokenizer('echo "Yes";', function(error, tokens) {
		test.ifError(error);
		test.equal(tokens.length, 3, "Wrong number of tokens returned.");
		test.equal(tokens[0].type, 'ECHO', "Echo token not recognized.");
		test.equal(tokens[1].type, 'QUOTED_STRING', "Quoted string not recognized.");
		test.equal(tokens[2].type, 'SEMICOLON', "Semicolon not recognized.");
		test.done();
	});
};

module.exports.testDoubleString = function(test) {
	test.expect(8);
	tokenizer('echo "Yes"; echo "No";', function(error, tokens) {
		test.ifError(error);
		test.equal(tokens.length, 6, "Wrong number of tokens returned.");
		test.equal(tokens[0].type, 'ECHO', "Echo token not recognized.");
		test.equal(tokens[1].type, 'QUOTED_STRING', "Quoted string not recognized.");
		test.equal(tokens[2].type, 'SEMICOLON', "Semicolon not recognized.");
		test.equal(tokens[3].type, 'ECHO', "Echo token not recognized.");
		test.equal(tokens[4].type, 'QUOTED_STRING', "Quoted string not recognized.");
		test.equal(tokens[5].type, 'SEMICOLON', "Semicolon not recognized.");
		test.done();
	});
};

module.exports.testBlocks = function(test) {
	test.expect(11);
	tokenizer('if (true) { echo "Yes"; }', function(error, tokens) {
		test.ifError(error);
		test.equal(tokens.length, 9, "Wrong number of tokens returned.");
		test.equal(tokens[0].type, 'IF', "If token not recognized.");
		test.equal(tokens[1].type, 'LEFT_PAREN', "Left parenthesis not recognized.");
		test.equal(tokens[2].type, 'STRING', "Bare string not recognized.");
		test.equal(tokens[3].type, 'RIGHT_PAREN', "Right parenthesis not recognized.");
		test.equal(tokens[4].type, 'LEFT_CURLY', "Block not recogniezd.");
		test.equal(tokens[5].type, 'ECHO', "Block not recogniezd.");
		test.equal(tokens[6].type, 'QUOTED_STRING', "Block not recogniezd.");
		test.equal(tokens[7].type, 'SEMICOLON', "Block not recogniezd.");
		test.equal(tokens[8].type, 'RIGHT_CURLY', "Block not recogniezd.");
		test.done();
	});
};