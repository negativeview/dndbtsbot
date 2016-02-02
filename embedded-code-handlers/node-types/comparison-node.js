var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function ComparisonNode(codeHandler, description, compareFunction) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'COMPARISON' + description;
	this.left = [];
	this.right = [];

	this.compareFunction = compareFunction;
};
util.inherits(ComparisonNode, SyntaxTreeNode);

ComparisonNode.prototype.execute = function(parent, codeState, cb) {
	this.codeHandler.handleTokenList(
		(error, result) => {
			this.leftDone(cb, codeState, error, result);
		},
		codeState,
		null,
		this.left
	);
};

ComparisonNode.prototype.leftDone = function(cb, codeState, error, result) {
	if (error) return cb(error);

	var stringValue = '';

	switch (result.type) {
		case 'QUOTED_STRING':
			stringValue = result.stringValue;
			break;
		case 'VARIABLE':
			result.getScalarValue(
				(error, value) => {
					if (error) return cb(error);

					this.codeHandler.handleTokenList(
						(error, result) => {
							this.rightDone(cb, codeState, value, error, result);
						},
						codeState,
						null,
						this.right
					);
				}
			);
			return;
			break;
		case 'BARE_STRING':
			var strValue = '';
			if (result.stringValue in codeState.variables) {
				strValue = codeState.variables[result.stringValue];
			}

			this.codeHandler.handleTokenList(
				(error, result) => {
					this.rightDone(cb, codeState, strValue, error, result);
				},
				codeState,
				null,
				this.right
			);
			return;
			break;
		case 'BOOLEAN':
			stringValue = result.booleanValue ? 'true' : 'false';
			break;
		default:
			console.log(result);
			throw new Error('Left unknown type:' + result.type);
	}

	this.codeHandler.handleTokenList(
		(error, result) => {
			this.rightDone(cb, codeState, stringValue, error, result);
		},
		codeState,
		null,
		this.right
	);
};

ComparisonNode.prototype.rightDone = function(cb, codeState, left, error, result) {
	var stringValue = '';

	var result2 = new SyntaxTreeNode(codeState);
	result2.type = 'BOOLEAN';

	switch (typeof(result)) {
		case 'object':
			switch (result.type) {
				case 'QUOTED_STRING':
					stringValue = result.stringValue;
					break;
				case 'BOOLEAN':
					stringValue = result.booleanValue ? 'true' : 'false';
					break;
				case 'BARE_STRING':
					if (parseInt(result.stringValue) != NaN) {
						stringValue = result.stringValue;
						break;
					}
				default:
					console.log(result);
					throw new Error('Right unknown type:' + result.type);
					break;
			}
			break;
		case 'string':
			stringValue = result;
			break;
		default:
			throw new Error(typeof(result));
	}

	result2.booleanValue = this.compareFunction(left, stringValue);
	return cb(null, result2);
};

module.exports = ComparisonNode;