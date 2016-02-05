var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function ParenthesisNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'PARENTHESIS';
	this.before = [];
	this.sub = [];
};
util.inherits(ParenthesisNode, SyntaxTreeNode);

ParenthesisNode.prototype.execute = function(parent, codeState, cb) {
	if (this.before.length) {
		this.codeHandler.handleTokenList(
			(error, result) => {
				this.executeSecond(cb, codeState, error, result);
			},
			codeState,
			null,
			this.before,
			this
		);
	} else {
		this.codeHandler.handleTokenList(
			(error, result) => {
				this.executeInnards(cb, codeState, error, result);
			},
			codeState,
			null,
			this.sub,
			this
		);
	}
}

ParenthesisNode.prototype.executeInnards = function(cb, codeState, error, value) {
	return cb(error, value);
}

ParenthesisNode.prototype.executeSecond = function(cb, codeState, error, value) {
	if (error) return cb(error);

	switch (value.type) {
		case 'IF':
			this.codeHandler.handleTokenList(
				(error, result) => {
					this.executeForIf(cb, value, error, result);
				},
				codeState,
				null,
				this.sub,
				this
			);			
			break;
		case 'TABLE':
			this.codeHandler.handleTokenList(
				(error, result) => {
					this.executeForTable(cb, value, error, result);
				},
				codeState,
				null,
				this.sub,
				this
			);
			break;
		case 'FOREACH':
			this.codeHandler.handleTokenList(
				(error, result) => {
					this.executeForForeach(cb, value, error, result);
				},
				codeState,
				null,
				this.sub,
				this
			);
			break;
		case 'ROLL':
			this.codeHandler.handleTokenList(
				(error, result) => {
					this.executeForRoll(cb, value, error, result);
				},
				codeState,
				null,
				this.sub,
				this
			);
			break;
		default:
			throw new Error('Not an if: ' + value.type);
	}
};

ParenthesisNode.prototype.executeForForeach = function(cb, foreachNode, error, node) {
	switch (node.type) {
		case 'VARIABLE':
			foreachNode.loopValue = node;
			return cb(null, foreachNode);
			break;
		default:
			console.log(node);
			throw new Error('Node!');
	}
};

ParenthesisNode.prototype.executeForTable = function(cb, tableNode, error, node) {
	switch (node.type) {
		case 'QUOTED_STRING':
			tableNode.executeString(node.stringValue, cb);
			break;
		default:
			console.log(node);
			throw new Error('Node!');
	}
};

ParenthesisNode.prototype.executeForRoll = function(cb, rollNode, error, node) {
	if (error) return cb(error);
	
	switch (node.type) {
		case 'QUOTED_STRING':
			rollNode.executeString(node.stringValue, cb);
			break;
		default:
			console.log('node??', node);
			throw new Error('Node!');
	}
};

ParenthesisNode.prototype.executeForIf = function(cb, ifNode, error, node) {
	if (error) return cb(error);
	
	switch (node.type) {
		case 'BOOLEAN':
			ifNode.booleanValue = node.booleanValue;
			return cb(null, ifNode);
		default:
			throw new Error('If predicate is not a boolean, is ' + node.type);
	}
}

module.exports = ParenthesisNode;