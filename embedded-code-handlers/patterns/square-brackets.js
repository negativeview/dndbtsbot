var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(codeHandler, state, cb) {
	if (this.nodes.length != 2) {
		return cb('[] excepts two sub-nodes. How did this even happen??');
	}

	var leftNode = this.nodes[0];
	leftNode.work(codeHandler, state, work2.bind(this, cb, codeHandler, state));
}

function work2(cb, codeHandler, state, error, value) {
	if (error) return cb(error);
		
	var leftHandSide = value;
	if (leftHandSide.type != 'VARIABLE') {
		return cb('square-brackets: Expecting variable, got ', leftHandSide.type);
	}

	var rightNode = this.nodes[1];
	rightNode.work(codeHandler, state, work3.bind(this, cb, leftHandSide, state));
}

function work3(cb, leftHandSide, state, error, value) {
	var rightHandSide = value;

	if (leftHandSide.type == 'VARIABLE') {
		// NOTE: This works for numbers, but won't work for variables. :()
		if (rightHandSide.type == 'STRING') {
			var varNameOrNumber = rightHandSide.strRep;

			if (state.variables[varNameOrNumber])
				varNameOrNumber = state.variables[varNameOrNumber];

			leftHandSide.setIndex(varNameOrNumber);

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

function toString() {
	return this.nodes[0].toString() + '[' + this.nodes[1].toString() + ']';
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
	process: function(codeHandler, node, state, index, cb) {
		var left = [];
		var right = [];

		for (var i = 0; i < index; i++) {
			left.push(node.tokenList[i]);
		}
		var leftNode = new SyntaxTreeNode(node);
		leftNode.strRep = '';
		leftNode.tokenList = left;

		for (var i = index + 1; i < node.tokenList.length; i++) {
			if (node.tokenList[i].type != 'RIGHT_BRACKET') {
				right.push(node.tokenList[i]);
			} else {
				break;
			}
		}
		var rightNode = new SyntaxTreeNode(node);
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
		node.toString = toString;

		return cb('', node);
	}
};
