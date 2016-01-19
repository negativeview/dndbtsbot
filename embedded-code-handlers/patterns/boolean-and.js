var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, cb) {
	throw new Error("Not implemented");
	
	if (this.nodes.length != 2) {
		return cb('= excepts two sub-nodes. How did this even happen??');
	}

	var leftNode = this.nodes[0];
	leftNode.work(stateHolder, state, function(error, value) {
		if (error) {
			throw new Error(error);
		}
		var leftHandSide = value;

		var rightNode = this.nodes[1];
		rightNode.work(stateHolder, state, function(error, value) {
			var rightHandSide = value;

			if (leftHandSide.type == 'variable') {
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
