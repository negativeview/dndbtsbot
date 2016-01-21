var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function BareStringNode(codeHandler, stringValue) {
	SyntaxTreeNode.call(codeHandler);
	this.stringValue = stringValue;
	this.type = 'BARE_STRING';
}
util.inherits(BareStringNode, SyntaxTreeNode);

BareStringNode.prototype.toString = function() {
	console.log('codeHandler', this.codeHandler);
	return this.stringValue;
}

BareStringNode.prototype.execute = function(parent, codeState, cb) {
	return cb(null, this);
}

BareStringNode.prototype.toBoolean = function() {
	if (!this.stringValue) return false;
	if (this.stringValue == '') return false;
	return true;
}

BareStringNode.prototype.toNumber = function() {
	if (!this.stringValue) return 0;
	if (this.stringValue.match(/^[-+]?[0-9]+$/)) {
		return parseInt(this.stringValue);
	}

	throw new Error('Could not convert from ' + this.stringValue + ' to a number.');
}

BareStringNode.prototype.canNumber = function() {
	if (!this.stringValue) return true;
	if (this.stringValue.match(/^[-+]?[0-9]+$/)) {
		return true;
	}
	return false;
}

module.exports = BareStringNode;