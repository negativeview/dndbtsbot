var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, node, cb) {
	if (node.nodes.length != 3) {
		return cb('{} expects three sub-nodes. How did this even happen??');
	}

	node.nodes[0].work(stateHolder, state, node.nodes[0], function(error, value) {
		if (error) return cb(error);
		node.nodes[1].work(stateHolder, state, node.nodes[1], function(error, value) {
			if (error) return cb(error);
			if (node.nodes[2].type == 'unparsed-node-list' && node.nodes[2].tokenList.length == 0) return cb();

			node.nodes[2].work(stateHolder, state, node.nodes[2], cb);
		});
	});
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
	process: function(node, state, index, cb) {
		var before = new SyntaxTreeNode();
		for (var i = 0; i < index; i++) {
			var token = node.tokenList[i];
			before.tokenList.push(token);
		}
		node.addSubNode(before);

		var inside = new SyntaxTreeNode();
		var count = 0;
		for (var i = index + 1; i < node.tokenList.length; i++) {
			var token = node.tokenList[i];
			if (token.type == 'RIGHT_CURLY') {
				if (count == 0) {
					break;
				} else {
					count--;
				}
			} else if (token.type == 'LEFT_CURLY') {
				count++;
			}
			inside.tokenList.push(token);
		}
		node.addSubNode(inside);

		var after = new SyntaxTreeNode();
		for (i = i + 1; i < node.tokenList.length; i++) {
			var token = node.tokenList[i];
			after.tokenList.push(token);
		}
		node.addSubNode(after);

		node.strRep = '{}';
		node.work = work;
		node.type = 'CURLY BRACES';
		node.tokenList = [];

		return cb('', node);
	}
};
