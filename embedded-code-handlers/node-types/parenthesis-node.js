var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function ParenthesisNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'PARENTHESIS';
	this.before = [];
	this.sub = [];
};
util.inherits(ParenthesisNode, SyntaxTreeNode);

ParenthesisNode.prototype.canNumber = function() {
	return false;
};

ParenthesisNode.prototype.execute = function(parent, codeState, cb) {
	if (this.before.length) {
		console.log('this.before', this.before);
		this.codeHandler.handleTokenList(
			this.executeSecond.bind(this, cb, codeState),
			codeState,
			null,
			this.before,
			this
		);
	} else {
		console.log('blah');
		this.executeSecond(cb);
	}
}

ParenthesisNode.prototype.executeSecond = function(cb, codeState, error, value) {
	var m = this;

	console.log('executeSecond');

	if (this.handler) {
		console.log('a');
		this.codeHandler.handleTokenList(
			function(innerNode, error, otherNode) {
				m.handler(cb, innerNode, error, otherNode);
			},
			codeState,
			null,
			this.sub,
			this
		);
	} else {
		this.codeHandler.handleTokenList(
			cb,
			codeState,
			null,
			this.sub,
			this
		);		
	}
};

ParenthesisNode.prototype.executeDone = function(cb) {
	return cb(this);
}

module.exports = ParenthesisNode;