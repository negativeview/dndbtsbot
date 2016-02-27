var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function AsteriskNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = '*';
	this.left = [];
	this.right = [];
};
util.inherits(AsteriskNode, SyntaxTreeNode);

AsteriskNode.prototype.execute = function(parent, codeState, cb) {
	this.codeHandler.handleTokenList(
		(error, value) => {
			this.leftDone(cb, codeState, error, value);
		},
		codeState,
		null,
		this.left
	);
};

AsteriskNode.prototype.leftDone = function(cb, codeState, error, value) {
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
			if (!isNaN(parseInt(value.stringValue))) {
				this.codeHandler.handleTokenList(
					(error, value2) => {
						this.rightDone(cb, codeState, value.stringValue, error, value2);
					},
					codeState,
					null,
					this.right
				);
				return;				
			} else {
				console.log('Echo a');
				if (value.stringValue in codeState.variables) {
					console.log('Echo b');
					var leftVariable = codeState.variables[value.stringValue];
					if (typeof(leftVariable) == 'object') {
						leftVariable = leftVariable.stringValue;
					}

					console.log('Echo c', leftVariable);

					this.codeHandler.handleTokenList(
						(error, value2) => {
							this.rightDone(cb, codeState, leftVariable, error, value2);
						},
						codeState,
						null,
						this.right
					);
					return;
				}
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

AsteriskNode.prototype.leftTwo = function (cb, codeState, err, val) {
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

AsteriskNode.prototype.rightDone = function(cb, codeState, leftValue, error, rightNode) {
	if (error) return cb(error);

	switch (rightNode.type) {
		case 'BARE_STRING':
			if (!isNaN(parseInt(rightNode.stringValue))) {
				console.log('parseInt', parseInt(rightNode.stringValue));
				this.totalDone(cb, codeState, leftValue, null, rightNode.stringValue);
				return;				
			} else {
				if (rightNode.stringValue in codeState.variables) {
					var rightVariable = codeState.variables[rightNode.stringValue];
					if (typeof(rightVariable) == 'object') {
						rightVariable = rightVariable.stringValue;
					}
					this.totalDone(cb, codeState, leftValue, null, rightVariable);
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

AsteriskNode.prototype.totalDone = function(cb, codeState, leftValue, error, rightValue) {
	console.log(leftValue);
	if (typeof(leftValue) == 'number' || leftValue.match(/^[\-\+]?[0-9]+$/)) {
		console.log(rightValue);
		if (typeof(rightValue) == 'number' || rightValue.match(/^[\-\+]?[0-9]+$/)) {
			var retNode = new SyntaxTreeNode(codeState.programNode.codeHandler);
			retNode.type = 'QUOTED_STRING';
			retNode.stringValue = parseInt(leftValue) * parseInt(rightValue);
			return cb(null, retNode);
		} else {
			console.log('rightValue', rightValue);
		}
	} else {
		console.log('leftValue', leftValue);
	}

	throw new Error('Multiplying things that are not numbers? What are you thinking?? (' + leftValue + ', ' + rightValue + ', ' + parseInt(rightValue) + ')');
}

module.exports = AsteriskNode;