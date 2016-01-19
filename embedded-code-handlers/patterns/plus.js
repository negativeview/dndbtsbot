var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, cb) {
	if (this.nodes.length != 2) {
		return cb('+ expects two sub-nodes. How did this even happen??');
	}

	var leftNode = this.nodes[0];
	leftNode.work(stateHolder, state, work2.bind(this, cb, stateHolder, state));
};

function work2(cb, stateHolder, state, error, value) {
	if (error) return cb(error);

	if (!value) {
		throw new Error('+ was not given a left value.');
	}

	var leftValue = value;

	var rightNode = this.nodes[1];

	if (leftValue.type == 'STRING') {
		leftValue = state.variables[leftValue.strRep];
	} else if (leftValue.type == 'QUOTED_STRING') {
		leftValue = leftValue.strRep;
	} else if (leftValue.type == 'VARIABLE') {
		var m = this;

		leftValue.getScalarValue(
			function(error, value) {
				if (error) return cb(error);
				return rightNode.work(stateHolder, state, work3.bind(m, cb, value, state));
			}
		);
		return;
	} else {
		throw new Error('Left value of + is not a known type of value: ' + leftValue.type);
	}

	rightNode.work(stateHolder, state, work3.bind(this, cb, leftValue, state));
}

function work3(cb, leftValue, state, error, value) {
	if (error) return cb(error);

	var rightValue = value;
	if (rightValue.type == 'STRING') {
		rightValue = state.variables[rightValue.strRep];
	} else if (rightValue.type == 'QUOTED_STRING') {
		rightValue = rightValue.strRep;
	} else if (rightValue.type == 'VARIABLE') {
		var m = this;
		rightValue.getScalarValue(
			function(error, value) {
				if (error) return cb(error);

				return work4(leftValue, value, cb);
			});
		return;
	} else {
		throw new Error('Right value of + is not a known type of value: ' + rightValue.type);
	}

	return work4(leftValue, rightValue, cb);
}

function work4(leftValue, rightValue, cb) {
	var returnNode = new SyntaxTreeNode();
	returnNode.type = 'QUOTED_STRING';
	returnNode.strRep = leftValue + rightValue;

	return cb(null, returnNode);
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
	process: function(node, state, index, cb) {
		node.type = 'PLUS';
		node.strRep = '+';

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

		return cb('', node);
	}
};
