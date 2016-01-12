var tokenizer   = require('../embedded-code-handlers/base/tokenizer.js');
var codeHandler = require('../embedded-code-handler.js');
var SyntaxTreeNode = require('../embedded-code-handlers/base/syntax-tree-node.js');

// commandArray, node, state, cb

module.exports.testSimpleString = function(test) {
	tokenizer('echo "Yes"', function(error, tokens) {
		test.ifError(error, 'Error in simple parsing');
		if (!tokens)
			return test.done();
		test.equal(tokens.length, 2, "Wrong number of tokens from the tokenizer stage.");

		var stn = new SyntaxTreeNode();
		stn.strRep = '<program>';

		codeHandler.handleCommandPart(tokens, stn, null, function(error, topLevelNode) {
			test.ifError(error);

			test.equal('<program>', topLevelNode.strRep, "Wrong node chosen for top level node.");
			test.equal(1, topLevelNode.nodes.length, "Top level node has wrong number of children.");

			var node = topLevelNode.nodes[0];
			test.equal('echo', node.strRep, node.strRep);
			test.equal(1, node.nodes.length, "Echo node has wrong number of children.");

			var node = node.nodes[0];
			test.equal('Yes', node.strRep, node.strRep);
			test.equal(0, node.nodes.length, "Echo node has wrong number of children.");

			test.done();
		})
	});
};

module.exports.testIfElse = function(test) {
	tokenizer('channel.Health[{1}] = {3}; channel.Group[{1}] = {2}; if ({4} == "true") {channel.Type[{1}] = "Monster";} else {channel.Type[{1}] = "Player";}', function(error, tokens) {
		test.ifError(error);
		if (!error) {
			var stn = new SyntaxTreeNode();
			stn.strRep = '<program>';

			codeHandler.handleCommandPart(tokens, stn, null, function(error, topLevelNode) {
				test.ifError(error);

				test.equal('<program>', topLevelNode.strRep, "Wrong node chosen for top level node.");
				test.equal(1, topLevelNode.nodes.length, "Top level node has wrong number of children.");

				var node = topLevelNode.nodes[0];
				test.equal('echo', node.strRep, node.strRep);
				test.equal(1, node.nodes.length, "Echo node has wrong number of children.");

				test.done();
			});
		} else {
			test.done();
		}
	});
}