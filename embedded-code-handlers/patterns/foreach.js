var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, cb) {
	var comparison = this.nodes[0];
	comparison.work(stateHolder, state, work2.bind(this, cb, comparison, stateHolder, state));
}

function work2(cb, comparison, stateHolder, state, error, value) {
	if (error) return cb(error);

	value.getTable(work3.bind(this, cb));
}

function work3(cb, err, res) {
	if (err) return cb(error);

	var toLoopOver = [];
	for (var i = 0; i < res.length; i++) {
		var row = res[i];

		var variableOverride = {
			key: row['key'],
			value: row['value']
		};
		toLoopOver.push(variableOverride);
	}

	this.toLoopOver = toLoopOver;
	return cb(null, this);
}

function goUntil(command, i, mod, limit, typeA, typeB, cb) {
	var collection = [];
	var count = 0;
	for (
		var m = i - 1;
		limit == 0 ? m >= 0 : m < limit;
		m += mod
	) {
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
	}

	return {
		m: m,
		collection: collection
	};
}

function toString() {
	return 'foreach (' + this.nodes[0].toString() + ')';
}

module.exports = {
	name: 'Foreach',
	matches: function(command) {
		for (var i = command.length - 1; i > 0; i--) {
			if (command[i].type == 'RIGHT_PAREN') {
				var m = goUntil(command, i, -1, 0, 'RIGHT_PAREN', 'LEFT_PAREN');
				m = m.m;

				if (m - 1 < 0) {
					return false;
				}

				if (command[m-1].type == 'FOREACH') return m - 1;
			}
		}
		return false;
	},
	process: function(codeHandler, node, state, index, cb) {
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
		node.strRep = 'Foreach';
		node.type = 'FOREACH';
		node.tokenList = [];
		node.toString = toString;
		return cb('', node);
	}
};
