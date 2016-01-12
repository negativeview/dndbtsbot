var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, node, cb) {
	if (node.nodes.length != 1) {
		return cb('{} expects one sub-node. How did this even happen??');
	}

	node.nodes[0].work(stateHolder, state, node.nodes[0], cb)
}

module.exports = {
	name: 'Curly Braces',
	matches: function(command) {
		var foundRight = false;
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'RIGHT_CURLY') {
				foundRight = true;
				var count = 0;

				for (var m = i - 1; m >= 0; m--) {
					if (command[m].type == 'LEFT_CURLY') {
						if (count == 0) {
							if (m != 0) {
								return false;
							}
							return m;
						} else {
							count--;
						}
					} else if (command[m].type == 'RIGHT_CURLY') {
						count++;
					}
				}
			}
		}
		return false;
	},
	process: function(command, node, state, index, cb) {
		var inside = []

		var count = 0;
		for (var i = index + 1; i < command.length; i++) {
			var token = command[i];
			if (token.type == 'RIGHT_CURLY') {
				if (count == 0) {
					break;
				} else {
					count--;
				}
			} else if (token.type == 'LEFT_CURLY') {
				count++;
			}
			inside.push(token);
		}

		var stn = new SyntaxTreeNode();
		stn.strRep = '()';
		stn.addSubTree(inside);
		stn.work = work;

		return cb('', stn);
	}
};
