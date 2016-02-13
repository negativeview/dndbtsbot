var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function TableNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'TABLE';
};
util.inherits(TableNode, SyntaxTreeNode);

TableNode.prototype.execute = function(parent, codeState, cb) {
	console.log('table.execute');
	switch (parent.type) {
		case 'PARENTHESIS':
			break;
		default:
			throw new Error('Table not followed by parenthesis.');
			break;
	}

	return cb(null, this);
};

TableNode.prototype.executeString = function(stringValue, cb) {
	var executionHelper = this.codeHandler.stateHolder.executionHelper;
	var m = this;
	executionHelper.handle(
		"!table " + stringValue,
		function(error) {
			return cb(error, m);
		}
	);
};

module.exports = TableNode;