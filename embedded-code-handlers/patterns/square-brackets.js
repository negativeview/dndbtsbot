var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, cb) {
	if (this.nodes.length != 2) {
		return cb('[] excepts two sub-nodes. How did this even happen??');
	}

	var leftNode = this.nodes[0];
	leftNode.work(stateHolder, state, work2.bind(this, cb, stateHolder, state));
}

function work2(cb, stateHolder, state, error, value) {
	if (error) return cb(error);
		
	var leftHandSide = value;
	if (leftHandSide.type != 'VARIABLE') {
		return cb('square-brackets: Expecting variable, got ', leftHandSide.type);
	}

	var rightNode = this.nodes[1];
	rightNode.work(stateHolder, state, work3.bind(this, cb, leftHandSide));
}

function work3(cb, leftHandSide, error, value) {
	var rightHandSide = value;

	if (leftHandSide.type == 'VARIABLE') {
		// NOTE: This works for numbers, but won't work for variables. :()
		if (rightHandSide.type == 'STRING') {
			leftHandSide.setIndex(rightHandSide.strRep);

			return cb(null, leftHandSide);
		} else if (rightHandSide.type == 'QUOTED_STRING') {
			leftHandSide.setIndex(rightHandSide.strRep);
			return cb(null, leftHandSide);
		} else {
			return cb('square-brackets: Do not know what to do with type ' + typeof(rightHandSide) + ' on the right');
		}
	} else {
		return cb('square-brackets: Do not know what to do with ' + typeof(leftHandSide) + ' on the left');
	}
}

module.exports = {
	name: 'Square Brackets',
	matches: function(command) {
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'LEFT_BRACKET') {
				return i;
			}
		}
		return false;
	},
	process: function(node, state, index, cb) {
		var left = [];
		var right = [];

		for (var i = 0; i < index; i++) {
			left.push(node.tokenList[i]);
		}
		var leftNode = new SyntaxTreeNode();
		leftNode.strRep = '';
		leftNode.tokenList = left;

		for (var i = index + 1; i < node.tokenList.length; i++) {
			if (node.tokenList[i].type != 'RIGHT_BRACKET') {
				right.push(node.tokenList[i]);
			} else {
				break;
			}
		}
		var rightNode = new SyntaxTreeNode();
		rightNode.strRep = '';
		rightNode.tokenList = right;

		if (i != (node.tokenList.length - 1)) {
			return cb(
				'Could not finish command: ' +
				node.tokenList.map(function(item) { return item.strValue; }).join(" ")
			);
		}

		node.strRep = '[]';
		node.type = 'SQUARE BRACKETS';
		node.work = work;
		node.addSubNode(leftNode);
		node.addSubNode(rightNode);
		node.tokenList = [];

		return cb('', node);
	}
};
