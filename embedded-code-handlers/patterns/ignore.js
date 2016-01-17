var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, node, cb) {
	if (node.nodes.length != 1) {
		return cb('echo excepts one sub-nodes. How did this even happen??');
	}

	node.nodes[0].work(stateHolder, state, node.nodes[0], function(error, value) {
		if (error) return cb(error);
		return cb();
	});
}

module.exports = {
	name: 'Echo',
	matches: function(command) {
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'IGNORE') {
				return i;
			}
		}
		return false;
	},
	process: function(node, state, index, cb) {
		if (index != 0) {
			throw "Ignore does not return anything.";
		}

		var sub = [];
		for (var i = 1; i < node.tokenList.length; i++) {
			sub.push(node.tokenList[i]);
		}
		var leftNode = new SyntaxTreeNode();
		leftNode.strRep = '';
		leftNode.tokenList = sub;

		node.strRep = 'ignore';
		node.addSubNode(leftNode);
		node.work = work;
		node.type = 'IGNORE';
		node.tokenList = [];

		return cb('', node);
	}
};
