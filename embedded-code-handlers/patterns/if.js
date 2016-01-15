var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, node, cb) {
	var before = node.nodes[0];
	var comparison = node.nodes[1];
	var trueBranch = node.nodes[2];
	var falseBranch = node.nodes[3];
	var after = node.nodes[4];

	before.work(stateHolder, state, before, function(error, value) {
		if (error) return cb(error);

		comparison.work(stateHolder, state, comparison, function(error, value) {
			if (error) return cb(error);

			var branch = null;
			switch (value) {
				case 'true':
					branch = trueBranch;
					break;
				case 'false':
					branch = falseBranch;
					break;
				default:
					return cb('Comparison value did not wind up being true or false.');
			}

			branch.work(stateHolder, state, branch, function(error, value) {
				if (error) return cb(error);

				if (after.type == 'unparsed-node-list' && after.nodes.length == 0)
					return cb();

				after.work(stateHolder, state, after, function(error, value) {
					return cb(error);
				});
			});
		});
	});
}

function goUntil(command, i, mod, limit, typeA, typeB, cb) {
	var collection = [];
	var count = 0;
	for (
		var m = i - 1;
		limit == 0 ? m >= 0 : m < limit;
		m += mod
	) {
		try {
			if (command[m].type == typeA) {
				count++;
			} else if (command[m].type == typeB) {
				if (count == 0) {
					break;
				} else {
					count--;
				}
			}
			collection.unshift(command[m]);
		} catch (e) {
			console.log(e.stack);
		}
	}

	return {
		m: m,
		collection: collection
	};
}

module.exports = {
	name: 'If',
	matches: function(command) {
		try {
			for (var i = command.length - 1; i > 0; i--) {
				if (command[i].type == 'RIGHT_CURLY') {
					var m = goUntil(command, i, -1, 0, 'RIGHT_CURLY', 'LEFT_CURLY');
					m = m.m;

					if (m - 1 < 0) {
						return false;
					}

					if (command[m - 1].type == 'RIGHT_PAREN') {
						m = goUntil(command, m - 1, -1, 0, 'RIGHT_PAREN', 'LEFT_PAREN');
						m = m.m;
						if (command[m-1].type == 'IF') return m - 1;
					} else if (command[m - 1].type == 'ELSE') {
						m = goUntil(command, m - 3, -1, 0, 'RIGHT_CURLY', 'LEFT_CURLY');
						m = m.m;
						if (m < 0) {
							return false;
						}
						if (command[m - 1].type == 'RIGHT_PAREN') {
							m = goUntil(command, m - 1, -1, 0, 'RIGHT_PAREN', 'LEFT_PAREN');
							m = m.m;
							if (command[m-1].type == 'IF') {
								return m - 1;
							}
						}
					}
				}
			}
		} catch (e) {
			console.log(e.stack);
		}
		return false;
	},
	process: function(node, state, index, cb) {
		try {
			var command = node.tokenList;
			
			var pre = new SyntaxTreeNode();
			pre.strRep = 'pre if statement';
			for (var i = 0; i < index; i++) {
				pre.tokenList.push(command[i]);
			}
			node.addSubNode(pre);

			var conditional = new SyntaxTreeNode();
			conditional.strRep = 'conditional';
			if (command[index + 1].type != 'LEFT_PAREN') {
				throw new Error("Missing a left parenthesis after IF statement" + command[index + 1].type);
			}

			var res = goUntil(command, index + 3, +1, command.length, 'LEFT_PAREN', 'RIGHT_PAREN');
			conditional.tokenList = res.collection.reverse();
			node.addSubNode(conditional);

			var m = res.m;
			res = goUntil(command, m + 3, +1, command.length, 'LEFT_CURLY', 'RIGHT_CURLY');
			m = res.m;

			var trueBranch = new SyntaxTreeNode();
			trueBranch.strRep = 'true branch';
			trueBranch.tokenList = res.collection.reverse();
			node.addSubNode(trueBranch);

			var elseBranch = new SyntaxTreeNode();
			elseBranch.strRep = 'elseBranch';
			if (command[res.m + 1].type == 'ELSE') {
				res = goUntil(command, m + 4, +1, command.length, 'LEFT_CURLY', 'RIGHT_CURLY');
				elseBranch.tokenList = res.collection.reverse();
			}
			node.addSubNode(elseBranch);

			var afterBranch = new SyntaxTreeNode();
			afterBranch.strRep = 'after';
			for (var i = res.m + 1; i < command.length; i++) {
				afterBranch.tokenList.push(command[i]);
			}
			node.addSubNode(afterBranch);

			node.work = work;
			node.strRep = 'IfElse';
			node.tokenList = [];

			console.log('got to end of process');
		} catch (e) {
			console.log('exception in if', e, e.stack);
			return cb(e);
		}
		return cb('', node);
	}
};
