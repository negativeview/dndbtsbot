var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function TableNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'TABLE';
};
util.inherits(TableNode, SyntaxTreeNode);

TableNode.prototype.execute = function(parent, codeState, cb) {
	switch (parent.type) {
		case 'PARENTHESIS':
			parent.handler = this.handleString.bind(this);
			break;
		default:
			throw new Error('Table not followed by parenthesis.');
			break;
	}

	return cb(this);
};

TableNode.prototype.handleString = function(cb, error, value) {
	var executionHelper = this.codeHandler.stateHolder.executionHelper;

	executionHelper.handle(
		"!table " + value,
		function(error) {
			if (error) return cb(this, error);

			console.log('got return from table', error);

			return cb(this);
		}
	);
};

TableNode.prototype._execute = function(cb, theNode, error, value) {
	console.log('Got to table-node:', theNode, error, value);
	return cb(this, null, null);
};

module.exports = TableNode;