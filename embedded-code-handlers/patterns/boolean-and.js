var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, node, cb) {
	throw new Error("Not implemented");
	
	if (node.nodes.length != 2) {
		return cb('= excepts two sub-nodes. How did this even happen??');
	}

	node.nodes[0].work(stateHolder, state, node.nodes[0], function(error, value) {
		if (error) {
			console.log('error in assignment', error);
			return cb(error);
		}
		var leftHandSide = value;

		node.nodes[1].work(stateHolder, state, node.nodes[1], function(error, value) {
			var rightHandSide = value;

			if (leftHandSide.type == 'variable') {
				leftHandSide.assign(rightHandSide, function(error) {
					if (error) {
						console.log('error when assigning', error);
						return cb(error);
					}
					return cb();
				});
			} else if (leftHandSide.type == 'STRING') {
				console.log('assigning ' + rightHandSide + ' to variable ' + leftHandSide.strRep);
				state.variables[leftHandSide.strRep] = rightHandSide;
				return cb();
			} else {
				console.log('Do not know how to assign to', typeof(leftHandSide));
				return cb('I do not know how to assign to ' + leftHandSide.type);
			}
		});
	});
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

		node.type = 'BOOLEAN_AND';
		node.strRep = '&&';
		node.addSubNode(leftNode);
		node.addSubNode(rightNode);
		node.work = work;
		node.tokenList = [];

		return cb('', node);
	}
};
