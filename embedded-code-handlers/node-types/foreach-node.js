var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function ForeachNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'FOREACH';
};
util.inherits(ForeachNode, SyntaxTreeNode);

ForeachNode.prototype.execute = function(parent, codeState, cb) {
	switch (parent.type) {
		case 'PARENTHESIS':
			parent.handler = this.handleData.bind(this);
			break;
		default:
			throw new Error('Foreach not followed by parenthesis:' + parent.type);
			break;
	}

	return cb(null, this);
};

ForeachNode.prototype.handleData = function(cb, error, value) {
	console.log(error, value);
	throw new Error('Got here');
};

module.exports = ForeachNode;