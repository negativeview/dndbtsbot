var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, node, cb) {
	node.nodes[0].work(stateHolder, state, node.nodes[0], function(error, value) {
		if (error) return cb(error);

		if (node.nodes.length > 1) {
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
	process: function(command, state, index, cb) {
		var left = [];
		var right = [];

		for (var i = 0; i < index; i++) {
			left.push(command[i]);
		}

		for (var i = index + 1; i < command.length; i++) {
			right.push(command[i]);
		}

		var stn = new SyntaxTreeNode();
		stn.strRep = ';';
		stn.addSubTree(left);
		stn.addSubTree(right);
		stn.work = work;

		return cb('', stn);
	}
};
