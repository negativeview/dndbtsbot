var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(codeHandler, state, cb) {
	if (this.nodes.length != 2) {
		return cb('&& expects two sub-nodes. How did this even happen??');
	}

	var leftNode = this.nodes[0];
	leftNode.work(codeHandler, state, work2.bind(this, cb, codeHandler, state));
}

function work2(cb, codeHandler, state, error, value) {
	if (error) {
		throw new Error(error);
	}
	
	var leftHandSide = value;
	if (leftHandSide.type != 'BOOLEAN') {
		console.log('&& left side', leftHandSide);
		throw new Error('&& must be applied to boolean arguments');
	}

	var leftTruthy = leftHandSide.booleanValue;
	var rightNode = this.nodes[1];
	rightNode.work(codeHandler, state, function(error, value) {
		var rightHandSide = value;
		if (rightHandSide.type != 'BOOLEAN') {
			console.log('&& right side', rightHandSide);
			throw new Error('&& must be applied to boolean arguments');
		}

		var rightTruthy = rightHandSide.booleanValue;
		var returnTruthy = leftTruthy && rightTruthy;

		var returnValue = new SyntaxTreeNode();
		returnValue.type = 'BOOLEAN';
		returnValue.booleanValue = returnTruthy;
		returnValue.strRep = returnValue.booleanValue ? 'true' : 'false';

		return cb(null, returnValue);
	});
}

function toString() {
	return this.nodes[0].toString() + ' && ' + this.nodes[1].toString();
}

module.exports = {
	name: 'Boolean AND',
	matches: function(command) {
		for (var i = command.length - 1; i > 0; i--) {
			if (command[i].type == 'BOOLEAN_AND') {
				return i;
			}
		}
		return false;
	},
	process: function(codeHandler, node, state, index, cb) {
		var left = [];
		var right = [];

		for (var i = 0; i < index; i++) {
			left.push(node.tokenList[i]);
		}
		var leftNode = new SyntaxTreeNode(node);
		leftNode.tokenList = left;

		for (var i = index + 1; i < node.tokenList.length; i++) {
			right.push(node.tokenList[i]);
		}
		var rightNode = new SyntaxTreeNode(node);
		rightNode.tokenList = right;

		node.type = 'BOOLEAN_AND';
		node.strRep = '&&';
		node.addSubNode(leftNode);
		node.addSubNode(rightNode);
		node.work = work;
		node.tokenList = [];
		node.toString = toString;

		return cb('', node);
	}
};
