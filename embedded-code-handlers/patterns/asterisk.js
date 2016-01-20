var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, cb) {
	if (this.nodes.length != 2) {
		return cb('* expects two sub-nodes. How did this even happen??');
	}

	helper.setupComparisonValues(this, stateHolder, state, workComplete.bind(this, cb));
};

function workComplete(cb, stateHolder, state, leftHandSide, rightHandSide) {
	var returnNode = new SyntaxTreeNode();
	returnNode.type = 'QUOTED_STRING';

	if (typeof(leftHandSide) == 'string' && leftHandSide.match(/^[-+]?[0-9]+$/))
		leftHandSide = parseInt(leftHandSide);
	if (typeof(rightHandSide) == 'string' && rightHandSide.match(/^[-+]?[0-9]+$/))
		rightHandSide = parseInt(rightHandSide);

	returnNode.strRep = leftHandSide * rightHandSide;

	return cb(null, returnNode);
}

function toString() {
	return this.nodes[0].toString() + ' * ' + this.nodes[1].toString();
}

module.exports = {
	name: 'Asterisk',
	matches: function(command) {
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'ASTERISK') {
				return i;
			}
		}
		return false;
	},
	process: function(node, state, index, cb) {
		node.type = 'ASTERISK';
		node.strRep = '*';

		var left = new SyntaxTreeNode();
		for (var i = 0; i < index; i++) {
			left.tokenList.push(node.tokenList[i]);
		}
		node.addSubNode(left);

		var right = new SyntaxTreeNode();
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
