var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

var semiColonID = 0;

function SemicolonNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'SEMICOLON';
	this.id = semiColonID++;
	this.didRight = false;
	this.left = [];
	this.right = [];
}
util.inherits(SemicolonNode, SyntaxTreeNode);

SemicolonNode.prototype.execute = function(parent, codeState, cb) {
	this.executeLeft(codeState, cb);
};

SemicolonNode.prototype.executeLeft = function(codeState, cb) {
	this.codeHandler.handleTokenList(
		(error, value) => {
			this.executeRight(codeState, cb, error, value);
		},
		codeState,
		null,
		this.left
	);
}

SemicolonNode.prototype.executeRight = function(codeState, cb, error, result) {
	if (error) return cb(error);

	if (this.didRight) throw new Error('Double right');
	this.didRight = true;

	if (this.right.length) {
		this.codeHandler.handleTokenList(
			(error, value) => {
				this.executionDone(cb, error, value)
			},
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