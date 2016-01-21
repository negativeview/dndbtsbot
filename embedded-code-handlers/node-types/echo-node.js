var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function EchoNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'ECHO';
	this.sub = [];
};
util.inherits(EchoNode, SyntaxTreeNode);

EchoNode.prototype.execute = function(parent, codeState, cb) {
	this.codeHandler.handleTokenList(
		this.executeDone.bind(this, cb),
		codeState,
		null,
		this.sub
	);
};

EchoNode.prototype.executeDone = function(cb, error, result) {
	this.codeHandler.stateHolder.simpleAddMessage(
		this.codeHandler.stateHolder.channelID, 
		result.toString()
	);
	return cb();
};

module.exports = EchoNode;