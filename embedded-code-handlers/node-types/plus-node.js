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
		(error, value) => {
			this.leftDone(cb, codeState, error, value)
		},
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
				(error, value) => {
					this.leftTwo(cb, codeState, error, value);
				}
			);
			return;
		case 'ROLL_RESULT':
			this.codeHandler.handleTokenList(
				(error, rightNode) => {
					this.rightDone(cb, codeState, value.output, error, rightNode);
				},
				codeState,
				null,
				this.right
			);
			return;
		case 'BARE_STRING':
			if (parseInt(value.stringValue)) {
				this.codeHandler.handleTokenList(
					(error, rightNode) => {
						this.rightDone(cb, codeState, value.stringValue, error, rightNode)
					},
					codeState,
					null,
					this.right
				);
				return;				
			} else {
				if (value.stringValue in codeState.variables) {
					this.codeHandler.handleTokenList(
						(error, rightNode) => {
							this.rightDone(cb, codeState, codeState.variables[value.stringValue], error, rightNode);
						},
						codeState,
						null,
						this.right
					);
				} else {
					this.codeHandler.handleTokenList(
						(error, rightNode) => {
							this.rightDone(cb, codeState, '', error, rightNode);
						},
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
				(error, rightNode) => {
					this.rightDone(cb, codeState, value.stringValue, error, rightNode);
				},
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
		(error, value) => {
			this.rightDone(cb, codeState, val, error, value);
		},
		codeState,
		null,
		this.right
	);
};

PlusNode.prototype.rightDone = function(cb, codeState, leftValue, error, rightNode) {
	if (error) return cb(error);

	switch (rightNode.type) {
		case 'ROLL_RESULT':
			this.totalDone(cb, codeState, leftValue, null, rightNode.output);
			return;
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
				(error, value) => {
					this.totalDone(cb, codeState, leftValue, error, value);
				}
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