var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, node, cb) {
	node.nodes[0].work(stateHolder, state, node.nodes[0], function(error, value) {
		if (error) return cb(error);

		if (node.nodes.length > 1) {
			if (node.nodes[1].type == 'unparsed-node-list' && node.nodes[1].tokenList.length == 0) return cb();
			node.nodes[1].work(stateHolder, state, node.nodes[1], function(error, value) {
				if (error) return cb(error);
			
				return cb();
			});
		} else {
			return cb();
		}
	});
}

module.exports = {
	name: 'Semicolon',
	matches: function(command) {
		for (var i = command.length - 1; i > 0; i--) {
			if (command[i].type == 'SEMICOLON') {
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
			right.push(node.tokenList[i]);
		}
		var rightNode = new SyntaxTreeNode();
		rightNode.strRep = '';
		rightNode.tokenList = right;

		node.type = 'parsed';
		node.strRep = ';';
		node.addSubNode(leftNode);

		if (rightNode.tokenList.length)
			node.addSubNode(rightNode);
		
		node.work = work;
		node.tokenList = [];

		return cb('', node);
	}
};