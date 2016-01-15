var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, node, cb) {
	if (node.nodes.length != 2) {
		return cb('[] excepts two sub-nodes. How did this even happen??');
	}

	node.nodes[0].work(stateHolder, state, node.nodes[0], function(error, value) {
		if (error) return cb(error);
		
		var leftHandSide = value;
		if (leftHandSide.type != 'variable') {
			return cb('square-brackets: Expecting variable, got ', leftHandSide);
		}

		node.nodes[1].work(stateHolder, state, node.nodes[1], function(error, value) {
			var rightHandSide = value;

			if (leftHandSide.type == 'variable') {
				if (typeof(rightHandSide) == 'string') {
					leftHandSide.setIndex(rightHandSide);


					console.log('got here', leftHandSide);



					return cb(null, leftHandSide);
				} else {
					return cb('square-brackets: Do not know what to do with type ' + typeof(rightHandSide) + ' on the right');
				}
			} else {
				return cb('square-brackets: Do not know what to do with ' + typeof(leftHandSide) + ' on the left');
			}
		});
	});
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
			console.log('Could not finish command', i, (node.tokenList.length - 1), node.tokenList);
			return cb('Could not finish command')
		}

		node.strRep = '[]';
		node.type = 'parsed';
		node.work = work;
		node.addSubNode(leftNode);
		node.addSubNode(rightNode);
		node.tokenList = [];

		return cb('', node);
	}
};
