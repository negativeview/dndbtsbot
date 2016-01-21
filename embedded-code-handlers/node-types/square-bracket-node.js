var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function SquareBracketNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'SQUARE_BRACKET';
	this.left = [];
	this.right = [];
};
util.inherits(SquareBracketNode, SyntaxTreeNode);

SquareBracketNode.prototype.execute = function(parent, codeState, cb) {
	this.codeHandler.handleTokenList(
		this.leftDone.bind(this, cb),
		codeState,
		null,
		this.left
	);
};

SquareBracketNode.prototype.leftDone = function(cb, parent, error, result) {
	//console.log('leftDone:', parent, error, result);
	return cb(this);

	this.codeHandler.stateHolder.simpleAddMessage(
		this.codeHandler.stateHolder.channelID, 
		result.toString()
	);
	return cb(this);
};

module.exports = SquareBracketNode;