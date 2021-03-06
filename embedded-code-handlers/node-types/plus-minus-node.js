var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function PlusMinusNode(codeHandler, type) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = type;
	this.left = [];
	this.right = [];
};
util.inherits(PlusMinusNode, SyntaxTreeNode);

PlusMinusNode.prototype.execute = function(parent, codeState, cb) {
	this.codeHandler.handleTokenList(
		(error, value) => {
			this.leftDone(cb, codeState, error, value)
		},
		codeState,
		null,
		this.left
	);
};

PlusMinusNode.prototype.leftDone = function(cb, codeState, error, value) {
	if (error) return cb(error);

	if (typeof(value) == 'string' || typeof(value) == 'number') {
		this.codeHandler.handleTokenList(
			(error, rightNode) => {
				this.rightDone(cb, codeState, value, error, rightNode);
			},
			codeState,
			null,
			this.right
		);
		return;
	}

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
			if (!isNaN(parseInt(value.stringValue))) {
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
					var toEcho = codeState.variables[value.stringValue];
					if (typeof(toEcho) == 'string') {
						this.codeHandler.handleTokenList(
							(error, rightNode) => {
								this.rightDone(cb, codeState, codeState.variables[value.stringValue], error, rightNode);
							},
							codeState,
							null,
							this.right
						);
					} else {
						return this.leftDone(cb, codeState, error, codeState.variables[value.stringValue]);
					}
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

	console.log('value', value);
	throw new Error(value);
};

PlusMinusNode.prototype.leftTwo = function (cb, codeState, err, val) {
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

PlusMinusNode.prototype.rightDone = function(cb, codeState, leftValue, error, rightNode) {
	if (error) return cb(error);

	if (typeof(rightNode) == 'string' || typeof(rightNode) == 'number') {
		this.totalDone(cb, codeState, leftValue, null, rightNode);
		return;
	}

	switch (rightNode.type) {
		case 'ROLL_RESULT':
			this.totalDone(cb, codeState, leftValue, null, rightNode.output);
			return;
		case 'BARE_STRING':
			if (!isNaN(parseInt(rightNode.stringValue))) {
				this.totalDone(cb, codeState, leftValue, null, rightNode.stringValue);
				return;				
			} else {
				if (rightNode.stringValue in codeState.variables) {
					var toEcho = codeState.variables[rightNode.stringValue];
					if (typeof(toEcho) == 'string' || typeof(toEcho) == 'number') {
						this.totalDone(cb, codeState, leftValue, null, codeState.variables[rightNode.stringValue]);
						return;
					} else {
						this.rightDone(cb, codeState, leftValue, error, codeState.variables[rightNode.stringValue]);
						return;
					}
				} else {
					this.rightDone(cb, codeState, leftValue, error, '');
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
	console.log('rightNode', rightNode);
	throw new Error('GOT HERE');
};

PlusMinusNode.prototype.totalDone = function(cb, codeState, leftValue, error, rightValue) {
	if (error) return cb(error);

	if (typeof(leftValue) == 'number' || leftValue.match(/^[\-\+]?[0-9]+$/)) {
		if (typeof(rightValue) == 'number' || rightValue.match(/^[\-\+]?[0-9]+$/)) {
			var retNode = new SyntaxTreeNode(codeState.programNode.codeHandler);
			retNode.type = 'QUOTED_STRING';
			switch (this.type) {
				case 'PLUS':
					retNode.stringValue = parseInt(leftValue) + parseInt(rightValue);
					break;
				case 'MINUS':
					retNode.stringValue = parseInt(leftValue) - parseInt(rightValue);
					break;
			}
			return cb(null, retNode);
		}
	}

	var retNode = new SyntaxTreeNode(codeState.programNode.codeHandler);
	retNode.type = 'QUOTED_STRING';
	retNode.stringValue = leftValue + rightValue;

	return cb(null, retNode);
}

module.exports = PlusMinusNode;