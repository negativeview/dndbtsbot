var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function PlusNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = '+';
	this.left = [];
	this.right = [];
};
util.inherits(PlusNode, SyntaxTreeNode);

PlusNode.prototype.execute = function(parent, codeState, cb) {
	this.codeHandler.handleTokenList(
		this.leftDone.bind(this, cb, codeState),
		codeState,
		null,
		this.left
	);
};

PlusNode.prototype.leftDone = function(cb, codeState, error, value) {
	if (error) return cb(error);

	switch (value.type) {
		case 'VARIABLE':
			value.getScalarValue(
				this.leftTwo.bind(this, cb, codeState)
			);
			return;
		case 'BARE_STRING':
			if (parseInt(value.stringValue)) {
				this.codeHandler.handleTokenList(
					this.rightDone.bind(this, cb, codeState, value.stringValue),
					codeState,
					null,
					this.right
				);
				return;				
			} else {
				if (value.stringValue in codeState.variables) {
					this.codeHandler.handleTokenList(
						this.rightDone.bind(this, cb, codeState, codeState.variables[value.stringValue]),
						codeState,
						null,
						this.right
					);
				} else {
					this.codeHandler.handleTokenList(
						this.rightDone.bind(this, cb, codeState, ''),
						codeState,
						null,
						this.right
					);					
				}
				return;
			}
			break;
		case 'QUOTED_STRING':
			this.codeHandler.handleTokenList(
				this.rightDone.bind(this, cb, codeState, value.stringValue),
				codeState,
				null,
				this.right
			);
			return;
	}

	console.log(value);
	throw new Error(value);
};

PlusNode.prototype.leftTwo = function (cb, codeState, err, val) {
	if (err) return cb(err);

	this.codeHandler.handleTokenList(
		this.rightDone.bind(this, cb, codeState, val),
		codeState,
		null,
		this.right
	);
};

PlusNode.prototype.rightDone = function(cb, codeState, leftValue, error, rightNode) {
	if (error) return cb(error);

	switch (rightNode.type) {
		case 'BARE_STRING':
			if (parseInt(rightNode.stringValue) != NaN) {
				this.totalDone(cb, codeState, leftValue, null, rightNode.stringValue);
				return;				
			} else {
				if (rightNode.stringValue in codeState.variables) {
					this.totalDone(cb, codeState, leftValue, null, codeState.variables[rightNode.stringValue]);
					return;
				}
			}
			break;
		case 'QUOTED_STRING':
			this.totalDone(cb, codeState, leftValue, null, rightNode.stringValue);
			return;
		case 'VARIABLE':
			rightNode.getScalarValue(
				this.totalDone.bind(this, cb, codeState, leftValue)
			);
			return;
	}
	console.log(rightNode);
	throw new Error('GOT HERE');
};

PlusNode.prototype.totalDone = function(cb, codeState, leftValue, error, rightValue) {
	if (leftValue.match(/^[\-\+]?[0-9]+$/)) {
		if (rightValue.match(/^[\-\+]?[0-9]+$/)) {
			var retNode = new SyntaxTreeNode(codeState.programNode.codeHandler);
			retNode.type = 'QUOTED_STRING';
			retNode.stringValue = parseInt(leftValue) + parseInt(rightValue);
			return cb(null, retNode);
		}
	}

	var retNode = new SyntaxTreeNode(codeState.programNode.codeHandler);
	retNode.type = 'QUOTED_STRING';
	retNode.stringValue = leftValue + rightValue;

	return cb(null, retNode);
}

module.exports = PlusNode;