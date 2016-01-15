var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, node, cb) {
	if (node.nodes.length != 2) {
		return cb('== excepts two sub-nodes. How did this even happen??');
	}

	node.nodes[0].work(stateHolder, state, node.nodes[0], function(error, value) {
		if (error) return cb(error);

		var leftHandSide = value;
		node.nodes[1].work(stateHolder, state, node.nodes[1], function(error, value) {
			if (error) return cb(error);
			var rightHandSide = value;

			if (rightHandSide == leftHandSide) {
				return cb(null, 'true');
			} else {
				return cb(null, 'false');
			}
		});
	});
}

module.exports = {
	name: 'Double Equals',
	matches: function(command) {
		for (var i = command.length - 1; i > 0; i--) {
			if (command[i].type == 'DOUBLE_EQUALS') {
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

		node.strRep = '==';
		node.work = work;

		return cb('', node);
	}
};
