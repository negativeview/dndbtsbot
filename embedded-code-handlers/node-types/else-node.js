var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function ElseNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'Else';
	this.before = [];
	this.after = [];
};
util.inherits(ElseNode, SyntaxTreeNode);

ElseNode.prototype.execute = function(parent, codeState, cb) {
	if (!('booleanValue' in parent)) {
		console.log('else parent', parent);
		throw new Error('No boolean value in parent?!');
	}

	parent.booleanValue = !parent.booleanValue;

	return cb(null, parent);
};

module.exports = ElseNode;