var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(codeHandler, state, cb) {
	if (this.nodes.length != 2) {
		return cb('< expects two sub-nodes. How did this even happen??');
	}

	helper.setupComparisonValues(this, codeHandler, state, workComplete.bind(this, cb));
}

function workComplete(cb, codeHandler, state, leftHandSide, rightHandSide) {
	var returnNode = new SyntaxTreeNode();
	returnNode.type = 'BOOLEAN';

	if (parseInt(leftHandSide) < parseInt(rightHandSide)) {
		returnNode.strRep = 'true';
		returnNode.booleanValue = true;
	} else {
		returnNode.strRep = 'false';
		returnNode.booleanValue = false;
	}

	return cb(null, returnNode);
}

module.exports = {
	name: 'Less than',
	matches: function(command) {
		for (var i = command.length - 1; i > 0; i--) {
			if (command[i].type == 'LEFT_ANGLE') {
				return i;
			}
		}
		return false;
	},
	process: function(codeHandler, node, state, index, cb) {
		var left = [];
		var right = [];

		var left = new SyntaxTreeNode(node);
		left.strRep = 'left';
		for (var i = 0; i < index; i++) {
			left.tokenList.push(node.tokenList[i]);
		}
		node.addSubNode(left);

		var right = new SyntaxTreeNode(node);
		right.strRep = 'right';
		for (var i = index + 1; i < node.tokenList.length; i++) {
			right.tokenList.push(node.tokenList[i]);
		}
		node.addSubNode(right);

		node.type = 'LESS_THAN';
		node.strRep = '<';
		node.work = work;
		node.tokenList = [];

		return cb('', node);
	}
};
