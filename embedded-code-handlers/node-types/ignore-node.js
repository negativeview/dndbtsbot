var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function IgnoreNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'IGNORE';
	this.sub = [];
};
util.inherits(IgnoreNode, SyntaxTreeNode);

IgnoreNode.prototype.execute = function(parent, codeState, cb) {
	this.codeHandler.handleTokenList(
		cb,
		codeState,
		null,
		this.sub
	);
};

module.exports = IgnoreNode;