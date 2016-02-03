var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function DivideNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = '/';
	this.left = [];
	this.right = [];
};
util.inherits(DivideNode, SyntaxTreeNode);

DivideNode.prototype.execute = function(parent, codeState, cb) {
	this.codeHandler.handleTokenList(
		(error, value) => {
			this.leftDone(cb, codeState, error, value);
		},
		codeState,
		null,
		this.left
	);
};

DivideNode.prototype.leftDone = function(cb, codeState, error, value) {
	if (error) return cb(error);

	switch (value.type) {
		case 'VARIABLE':
			value.getScalarValue(
				(error, value) => {
					this.leftTwo(cb, codeState, error, value);
				}
			);
			return;
		case 'BARE_STRING':
			if (parseInt(value.stringValue)) {
				this.codeHandler.handleTokenList(
					(error, value2) => {
						this.rightDone(cb, codeState, value.stringValue, error, value2);
					},
					codeState,
					null,
					this.right
				);
				return;				
			}
			break;
		case 'QUOTED_STRING':
			this.codeHandler.handleTokenList(
				(error, value2) => {
					this.rightDone(cb, codeState, value.stringValue, error, value2);
				},
				codeState,
				null,
				this.right
			);
			return;
	}

	throw new Error(value);
};

DivideNode.prototype.leftTwo = function (cb, codeState, err, val) {
	if (err) return cb(err);

	this.codeHandler.handleTokenList(
		(error, rightNode) => {
			this.rightDone(cb, codeState, val, error, rightNode);
		},
		codeState,
		null,
		this.right
	);
};

DivideNode.prototype.rightDone = function(cb, codeState, leftValue, error, rightNode) {
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
				(error, rightValue) => {
					this.totalDone(cb, codeState, leftValue, error, rightValue)
				}
			);
			return;
	}
	throw new Error('GOT HERE');
};

DivideNode.prototype.totalDone = function(cb, codeState, leftValue, error, rightValue) {
	if (leftValue.match(/^[\-\+]?[0-9]+$/)) {
		if (rightValue.match(/^[\-\+]?[0-9]+$/)) {
			var retNode = new SyntaxTreeNode(codeState.programNode.codeHandler);
			retNode.type = 'QUOTED_STRING';
			retNode.stringValue = parseInt(leftValue) / parseInt(rightValue);
			return cb(null, retNode);
		}
	}

	throw new Error('Got here');
}

module.exports = DivideNode;