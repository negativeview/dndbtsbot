var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function DeleteNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'DELTE';
	this.sub = [];
};
util.inherits(DeleteNode, SyntaxTreeNode);

DeleteNode.prototype.execute = function(parent, codeState, cb) {
	this.codeHandler.handleTokenList(
		(error, result) => {
			this.executeDone(cb, codeState, error, result);
		},
		codeState,
		null,
		this.sub
	);
};

DeleteNode.prototype.executeDone = function(cb, codeState, error, result) {
	if (error) return cb(error);
	
	switch (result.type) {
		default:
			throw new Error('Do not know how to delete ' + result.type);
			return cb();
	}
};

module.exports = DeleteNode;