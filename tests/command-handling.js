var tokenizer   = require('../embedded-code-handlers/base/tokenizer.js');
var codeHandler = require('../embedded-code-handler.js');

module.exports.testSimpleString = function(test) {
	tokenizer('echo "Yes"', function(error, tokens) {
		test.equal(tokens.length, 2, "Wrong number of tokens from the tokenizer stage.");
		codeHandler.handleCommandPart(tokens, function(error, topLevelNode) {
			test.ifError(error);

			test.equal('echo', topLevelNode.strRep, "Wrong node chosen for top level node.");
			test.equal('syntaxtreenode', topLevelNode.type, "Wrong type on top level node.");
			test.equal(1, topLevelNode.nodes.length, "Top level node has wrong number of children.");
			test.equal(0, topLevelNode.nodes[0].nodes.length, "Second level node has wrong number of children.");
			test.equal('Yes', topLevelNode.nodes[0].strRep, "Wrong string representation of node.");
			test.equal('syntaxtreenode', topLevelNode.nodes[0].type, "Wrong type on second node.");
			test.done();
		})
	});
};

module.exports.testIgnoreTable = function(test) {
	tokenizer('ignore table("delete channel Health")', function(error, tokens) {
		test.ifError(error);
		test.equal(tokens.length, 5, "Wrong number of tokens from the tokenizer stage.");
		codeHandler.handleCommandPart(tokens, function(error, topLevelNode) {
			test.ifError(error);

			var node = topLevelNode;
			test.equal('ignore', node.strRep, "Wrong node chosen for top level node.");
			test.equal('syntaxtreenode', node.type, "Wrong type on top level node.");
			test.equal(1, node.nodes.length, "Top level node has wrong number of children.");

			node = node.nodes[0];
			test.equal(1, node.nodes.length, "Second level node has wrong number of children.");
			test.equal('table', node.strRep, "Wrong string representation of node.");
			test.equal('syntaxtreenode', node.type, "Wrong type on second node.");

			node = node.nodes[0];
			test.equal(1, node.nodes.length, "Third level node has wrong number of children.");
			test.equal('()', node.strRep, "Wrong string representation of node.");
			test.equal('syntaxtreenode', node.type, "Wrong type on third node.");

			node = node.nodes[0];
			test.equal(0, node.nodes.length, "Fourth level node has wrong number of children.");
			test.equal('delete channel Health', node.strRep, "Wrong string representation of node.");
			test.equal('syntaxtreenode', node.type, "Wrong type on fourth node.");

			test.done();
		})
	});
};

module.exports.testIgnoreTable = function(test) {
	tokenizer('channel.groupNames[0] = "**Close Range (1 - 30 ft.)**"', function(error, tokens) {
		test.ifError(error);
		test.equal(8, tokens.length, "Wrong number of tokens from the tokenizer stage.");
		codeHandler.handleCommandPart(tokens, function(error, topLevelNode) {
			test.ifError(error);

			var node = topLevelNode;
			test.equal('=', node.strRep, "Wrong node chosen for top level node.");
			test.equal('syntaxtreenode', node.type, "Wrong type on top level node.");
			test.equal(2, node.nodes.length, "Top level node has wrong number of children.");

			var nodea = topLevelNode.nodes[0];
			var nodeb = topLevelNode.nodes[1];

			test.equal('[]', nodea.strRep, "Wrong node chosen");
			test.equal('syntaxtreenode', nodea.type, "Wrong type on node.");
			test.equal(2, nodea.nodes.length, "Node has wrong number of children.");

			test.equal('syntaxtreenode', nodeb.type, "Wrong type on node.");
			test.equal(0, nodeb.nodes.length, "Node has wrong number of children.");

			nodeb = nodea.nodes[1];
			nodea = nodea.nodes[0];

			test.equal('.', nodea.strRep, "Wrong node chosen");
			test.equal('syntaxtreenode', nodea.type, "Wrong type on node.");
			test.equal(2, nodea.nodes.length, "Node has wrong number of children.");

			test.equal('0', nodeb.strRep, "Wrong node chosen");
			test.equal('syntaxtreenode', nodeb.type, "Wrong type on node.");
			test.equal(0, nodeb.nodes.length, "Node has wrong number of children.");

			nodeb = nodea.nodes[1];
			nodea = nodea.nodes[0];

			test.equal('channel', nodea.strRep, "Wrong node chosen");
			test.equal('syntaxtreenode', nodea.type, "Wrong type on node.");
			test.equal(0, nodea.nodes.length, "Node has wrong number of children.");

			test.equal('groupNames', nodeb.strRep, "Wrong node chosen");
			test.equal('syntaxtreenode', nodeb.type, "Wrong type on node.");
			test.equal(0, nodeb.nodes.length, "Node has wrong number of children.");

			test.done();
		});
	});
};

module.exports.testMacroArguments = function(test) {
	tokenizer('channel.Health[{1}] = {3}', function(error, tokens) {
		test.ifError(error);
		test.equal(8, tokens.length, "Wrong number of tokens from the tokenizer stage.");
		codeHandler.handleCommandPart(tokens, function(error, topLevelNode) {
			test.ifError(error);

			var node = topLevelNode;
			test.equal('=', node.strRep, "Wrong node chosen for top level node.");
			test.equal('syntaxtreenode', node.type, "Wrong type on top level node.");
			test.equal(2, node.nodes.length, "Top level node has wrong number of children.");

			node = node.nodes[0];
			test.equal('[]', node.strRep, "Wrong node chosen for top level node.");
			test.equal('syntaxtreenode', node.type, "Wrong type on top level node.");
			test.equal(2, node.nodes.length, "Top level node has wrong number of children.");

			node = node.nodes[1];
			test.equal('{1}', node.strRep, "Wrong node chosen for top level node.");
			test.equal('syntaxtreenode', node.type, "Wrong type on top level node.");
			test.equal(0, node.nodes.length, "Top level node has wrong number of children.");

			test.done()
		});
	});
};