var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function IfNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'IF';
};
util.inherits(IfNode, SyntaxTreeNode);

IfNode.prototype.execute = function(parent, codeState, cb) {
	switch (parent.type) {
		case 'PARENTHESIS':
			parent.handler = this.handleBoolean.bind(this);
			break;
		default:
			throw new Error('If not followed by parenthesis:' + parent.type);
			break;
	}

	return cb(null, this);
};

IfNode.prototype.handleBoolean = function(cb, error, value) {
	if (!value) {
		throw new Error('No value in boolean');
	}
	return cb(null, this);

	var executionHelper = this.codeHandler.stateHolder.executionHelper;

	var m = this;
	executionHelper.handle(
		"!table " + value,
		function(error) {
			if (error) {
				return cb(error, m);
			}

			return cb(null, m);
		}
	);
};

module.exports = IfNode;