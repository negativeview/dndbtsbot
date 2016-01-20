var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, cb) {
	if (this.nodes.length != 2) {
		return cb('> expects two sub-nodes. How did this even happen??');
	}

	helper.setupComparisonValues(this, stateHolder, state, workComplete.bind(this, cb));
}

function workComplete(cb, stateHolder, state, leftHandSide, rightHandSide) {
	var returnNode = new SyntaxTreeNode();
	returnNode.type = 'BOOLEAN';

	if (parseInt(leftHandSide) > parseInt(rightHandSide)) {
		returnNode.strRep = 'true';
		returnNode.booleanValue = true;
	} else {
		returnNode.strRep = 'false';
		returnNode.booleanValue = false;
	}

	return cb(null, returnNode);
}

function work2(cb, stateHolder, state, error, value) {
	if (error) return cb(error);

	var leftHandSide = value;
	var rightNode = this.nodes[1];
	rightNode.work(stateHolder, state, function(error, value) {
		if (error) return cb(error);
		var rightHandSide = value;

		var returnNode = new SyntaxTreeNode();
		returnNode.type = 'BOOLEAN';

		if (parseInt(leftHandSide.strRep) > parseInt(rightHandSide.strRep)) {
			returnNode.strRep = 'true';
			returnNode.booleanValue = true;
		} else {
			returnNode.strRep = 'false';
			returnNode.booleanValue = false;
		}

		return cb(null, returnNode);
	});
}

module.exports = {
	name: 'Greater than',
	matches: function(command) {
		for (var i = command.length - 1; i > 0; i--) {
			if (command[i].type == 'RIGHT_ANGLE') {
				return i;
			}
		}
		return false;
	},
	process: function(node, state, index, cb) {
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

		node.type = 'GREATER_THAN';
		node.strRep = '>';
		node.work = work;
		node.tokenList = [];

		return cb('', node);
	}
};
