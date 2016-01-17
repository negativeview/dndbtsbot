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
				if (command[i].type == 'RIGHT_PAREN') {
					var m = goUntil(command, i, -1, 0, 'RIGHT_PAREN', 'LEFT_PAREN');
					m = m.m;

					if (m - 1 < 0) {
						return false;
					}

					if (command[m-1].type == 'IF') return m - 1;
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
			
			var conditional = new SyntaxTreeNode();
			conditional.strRep = 'conditional';
			if (command[index + 1].type != 'LEFT_PAREN') {
				throw new Error("Missing a left parenthesis after IF statement" + command[index + 1].type);
			}

			var res = goUntil(command, index + 3, +1, command.length, 'LEFT_PAREN', 'RIGHT_PAREN');
			conditional.tokenList = res.collection.reverse();
			node.addSubNode(conditional);

			node.work = work;
			node.strRep = 'If';
			node.type = 'If';
			node.tokenList = [];
		} catch (e) {
			return cb(e.stack);
		}
		return cb('', node);
	}
};
