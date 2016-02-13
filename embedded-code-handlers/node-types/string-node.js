var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function StringNode(codeHandler, stringValue) {
	SyntaxTreeNode.call(this, codeHandler);
	this.stringValue = stringValue;
	this.type = 'QUOTED_STRING';
}
util.inherits(StringNode, SyntaxTreeNode);

StringNode.prototype.execute = function(parent, codeState, cb) {
	return cb(null, this);
}

StringNode.prototype.toString = function() {
	return this.stringValue;
};

StringNode.prototype.toBoolean = function() {
	if (!this.stringValue) return false;
	if (this.stringValue == '') return false;
	return true;
};

StringNode.prototype.toNumber = function() {
	if (!this.stringValue) return 0;
	if (this.stringValue.match(/^[-+]?[0-9]+$/)) {
		return parseInt(this.stringValue);
	}

	throw new Error('Could not convert from ' + this.stringValue + ' to a number.');
};

StringNode.prototype.canNumber = function() {
	if (!this.stringValue) return true;
	if (this.stringValue.match(/^[-+]?[0-9]+$/)) {
		return true;
	}
	return false;
};

module.exports = StringNode;