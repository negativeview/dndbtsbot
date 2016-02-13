var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var helper = require('../helper.js');

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

	helper.convertToString(
		result,
		codeState,
		(error, stringValue) => {
			if (error) return cb(error);

			this.codeHandler.handleTokenList(
				(error, result) => {
					if (error) return cb(error);

					this.rightDone(cb, codeState, stringValue, null, result);
				},
				codeState,
				null,
				this.right
			);
		}
	);
};

ComparisonNode.prototype.rightDone = function(cb, codeState, left, error, result) {
	var stringValue = '';

	helper.convertToString(
		result,
		codeState,
		(error, stringValue) => {
			console.log('rightDone', error, stringValue);
			var result2 = new SyntaxTreeNode(codeState);
			result2.type = 'BOOLEAN';
			result2.booleanValue = this.compareFunction(left, stringValue);
			return cb(null, result2);
		}
	)

};

module.exports = ComparisonNode;