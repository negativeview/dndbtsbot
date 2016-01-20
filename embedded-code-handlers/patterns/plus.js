var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(codeHandler, state, cb) {
	if (this.nodes.length != 2) {
		return cb('+ expects two sub-nodes. How did this even happen??');
	}

	helper.setupComparisonValues(this, codeHandler, state, workComplete.bind(this, cb));
};

function workComplete(cb, codeHandler, state, leftHandSide, rightHandSide) {
	var returnNode = new SyntaxTreeNode();
	returnNode.type = 'QUOTED_STRING';

	if (leftHandSide.canNumber() && rightHandSide.canNumber()) {
		var num = leftHandSide.toNumber() + rightHandSide.toNumber();
		var ret = new StringNode(this.parent, num);
		return cb(null, ret);
	}

	if (leftHandSide.canString() && rightHandSide.canString()) {
		var str = leftHandSide.toString() + rightHandSide.toString();
		var ret = new StringNode(this.parent, str);

		return cb(null, ret);
	}

	throw new Error('Do not know how to add ' + leftHandSide.type + ' and ' + rightHandSide.type);
}

function toString() {
	return this.nodes[0].toString() + ' + ' + this.nodes[1].toString();
}

module.exports = {
	name: 'Plus',
	matches: function(command) {
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'PLUS') {
				return i;
			}
		}
		return false;
	},
	process: function(codeHandler, node, state, index, cb) {
		node.type = 'PLUS';
		node.strRep = '+';

		var left = new SyntaxTreeNode(node);
		for (var i = 0; i < index; i++) {
			left.tokenList.push(node.tokenList[i]);
		}
		node.addSubNode(left);

		var right = new SyntaxTreeNode(node);
		for (var i = index + 1; i < node.tokenList.length; i++) {
			right.tokenList.push(node.tokenList[i]);
		}
		node.addSubNode(right);
		node.work = work;
		node.tokenList = [];
		node.toString = toString;

		return cb('', node);
	}
};
