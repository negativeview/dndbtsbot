var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, cb) {
	if (this.nodes.length != 2) {
		return cb('!= excepts two sub-nodes. How did this even happen??');
	}

	helper.setupComparisonValues(this, stateHolder, state, workComplete.bind(this, cb));
}

function workComplete(cb, stateHolder, state, leftHandSide, rightHandSide) {
	console.log('!= in work', leftHandSide, rightHandSide);
	var returnNode = new SyntaxTreeNode();
	returnNode.type = 'BOOLEAN';

	if (leftHandSide != rightHandSide) {
		returnNode.strRep = 'true';
		returnNode.booleanValue = true;
	} else {
		returnNode.strRep = 'false';
		returnNode.booleanValue = false;
	}

	return cb(null, returnNode);
}

function toString() {
	return this.nodes[0].toString() + ' != ' + this.nodes[1].toString();
}

module.exports = {
	name: 'Not Equals',
	matches: function(command) {
		for (var i = command.length - 1; i > 0; i--) {
			if (command[i].type == 'NOT_EQUALS') {
				return i;
			}
		}
		return false;
	},
	process: function(codeHandler, node, state, index, cb) {
		var left = [];
		var right = [];

		var left = new SyntaxTreeNode();
		left.strRep = 'left';
		for (var i = 0; i < index; i++) {
			left.tokenList.push(node.tokenList[i]);
		}
		node.addSubNode(left);

		var right = new SyntaxTreeNode();
		right.strRep = 'right';
		for (var i = index + 1; i < node.tokenList.length; i++) {
			right.tokenList.push(node.tokenList[i]);
		}
		node.addSubNode(right);

		node.type = 'NOT EQUALS';
		node.strRep = '!=';
		node.work = work;
		node.tokenList = [];
		node.toString = toString;

		return cb('', node);
	}
};
