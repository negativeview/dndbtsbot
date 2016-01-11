var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, node, cb) {
	node.nodes[0].work(stateHolder, state, node.nodes[0], function(error, value) {
		if (error) return cb(error);

		if (value == 'true') {
			node.nodes[1].work(stateHolder, state, node.nodes[1], function(error, value) {
				if (error) return cb(error);

				return cb();
			});
		} else {
			node.nodes[2].work(stateHolder, state, node.nodes[2], function(error, value) {
				if (error) return cb(error);

				return cb();
			});
		}
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

					if (m - 1 < 0) return false;

					if (command[m - 1].type == 'RIGHT_PAREN') {
						m = goUntil(command, m - 1, -1, 0, 'RIGHT_PAREN', 'LEFT_PAREN');
						m = m.m;
						if (command[m-1].type == 'IF') return m - 1;
					} else if (command[m - 1].type == 'ELSE') {
						m = goUntil(command, m - 1, -1, 0, 'RIGHT_CURLY', 'LEFT_CURLY');
						m = m.m;
						if (m < 0) {
							return false;
						}
						if (command[m - 1].type == 'RIGHT_PAREN') {
							m = goUntil(command, m - 1, -1, 0, 'RIGHT_PAREN', 'LEFT_PAREN');
							m = m.m;
							if (command[m-1].type == 'IF') return m - 1;
						}
					}
				}
			}
		} catch (e) {
			console.log(e.stack);
		}
		return false;
	},
	process: function(command, state, index, cb) {
		var stn = new SyntaxTreeNode();

		if (command[index + 1].type != 'LEFT_PAREN') {
			return cb('Missing a left parenthesis after IF statmeent.');
		}

		var res = goUntil(command, index + 3, +1, command.length, 'LEFT_PAREN', 'RIGHT_PAREN');
		var comparisonCollection = res.collection;
		stn.addSubTree(comparisonCollection.reverse());

		var m = res.m;

		res = goUntil(command, m + 3, +1, command.length, 'LEFT_CURLY', 'RIGHT_CURLY');
		m = res.m;
		var ifCollection = res.collection;
		stn.addSubTree(ifCollection.reverse());

		if (command[res.m + 1].type == 'ELSE') {
			res = goUntil(command, m + 4, +1, command.length, 'LEFT_CURLY', 'RIGHT_CURLY');
			stn.addSubTree(res.collection.reverse());
		}
		stn.strRep = 'IfElse';
		stn.work = work;

		return cb('', stn);
	}
};
