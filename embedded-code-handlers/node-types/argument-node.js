var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function ArgumentNode(codeHandler, index) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'ARGUMENT';
	this.left = [];
	this.right = [];
	this.index = index;
};
util.inherits(ArgumentNode, SyntaxTreeNode);

ArgumentNode.prototype.execute = function(parent, codeState, cb) {
	var result = '';
	if (this.index.match(/[0-9]+\+/)) {
		var start = parseInt(this.index);
		for (var i = parseInt(this.index); i < codeState.args.length; i++) {
			if (result != '') {
				result += ' ' + codeState.args[i];
			}
		}
	} else if (codeState.args[parseInt(this.index)]) {
		result = codeState.args[parseInt(this.index)];
	}

	var res = new SyntaxTreeNode(this.codeHandler);
	res.type = 'QUOTED_STRING';
	res.stringValue = result;
	return cb(null, res);
};

module.exports = ArgumentNode;