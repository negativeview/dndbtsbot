var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function AssignmentNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'ASSIGNMENT';
	this.left = [];
	this.right = [];
};
util.inherits(AssignmentNode, SyntaxTreeNode);

AssignmentNode.prototype.execute = function(parent, codeState, cb) {
	this.codeHandler.handleTokenList(
		this.leftDone.bind(this, cb),
		codeState,
		null,
		this.left
	);
};

AssignmentNode.prototype.leftDone = function(cb, error, result) {
	return cb();

	this.codeHandler.stateHolder.simpleAddMessage(
		this.codeHandler.stateHolder.channelID, 
		result.toString()
	);
	return cb();
};

module.exports = AssignmentNode;