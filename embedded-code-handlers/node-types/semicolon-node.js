var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function SemicolonNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'SEMICOLON';
	this.left = [];
	this.right = [];
}
util.inherits(SemicolonNode, SyntaxTreeNode);

SemicolonNode.prototype.execute = function(parent, codeState, cb) {
	this.executeLeft(codeState, cb);
};

SemicolonNode.prototype.executeLeft = function(codeState, cb) {
	this.codeHandler.handleTokenList(
		this.executeRight.bind(this, codeState, cb),
		codeState,
		null,
		this.left
	);
}

SemicolonNode.prototype.executeRight = function(codeState, cb, error, result) {
	if (error) return cb(error);

	if (this.right.length) {
		this.codeHandler.handleTokenList(
			this.executionDone.bind(this, cb),
			codeState,
			null,
			this.right
		);
	} else {
		cb(null, this);
	}
};

SemicolonNode.prototype.executionDone = function(cb, error, result) {
	return cb(error, result);
}

module.exports = SemicolonNode;