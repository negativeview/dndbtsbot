var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, cb) {
	if (this.nodes.length != 2) {
		return cb('= excepts two sub-nodes. How did this even happen??');
	}

	var leftNode = this.nodes[0];
	leftNode.work(stateHolder, state, work2.bind(this, cb, stateHolder, state));
}

function work2(cb, stateHolder, state, error, value) {
	if (error) {
		return cb(error);
	}
	
	var leftHandSide = value;
	var rightNode = this.nodes[1];
	rightNode.work(stateHolder, state, work3.bind(this, cb, leftHandSide, state));
}

function work3(cb, leftHandSide, state, error, value) {
	var rightHandSide = value;

	switch (rightHandSide.type) {
		case 'QUOTED_STRING':
			rightHandSide = rightHandSide.strRep;
			break;
		default:
			throw new Error('When assigning to a variable, could not tell what right side was: ' + rightHandSide.type);
	}

	if (leftHandSide.type == 'VARIABLE') {
		leftHandSide.assign(rightHandSide, function(error) {
			if (error) {
				return cb(error);
			}
			return cb();
		});
	} else if (leftHandSide.type == 'STRING') {
		state.variables[leftHandSide.strRep] = rightHandSide;
		return cb();
	} else {
		return cb('I do not know how to assign to ' + leftHandSide.type);
	}
}

function toString() {
	return this.nodes[0].toString() + ' = ' + this.nodes[1].toString();
}

module.exports = {
	name: 'Assignment',
	matches: function(command) {
		for (var i = command.length - 1; i > 0; i--) {
			if (command[i].type == 'EQUALS') {
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
		leftNode.tokenList = left;

		for (var i = index + 1; i < node.tokenList.length; i++) {
			right.push(node.tokenList[i]);
		}
		var rightNode = new SyntaxTreeNode();
		rightNode.tokenList = right;

		node.type = 'ASSIGNMENT';
		node.strRep = '=';
		node.addSubNode(leftNode);
		node.addSubNode(rightNode);
		node.work = work;
		node.tokenList = [];
		node.toString = toString;

		return cb('', node);
	}
};