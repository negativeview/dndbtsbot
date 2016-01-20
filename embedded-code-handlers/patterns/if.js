var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(codeHandler, state, cb) {
	var comparison = this.nodes[0];
	comparison.work(codeHandler, state, work2.bind(this, cb, comparison));
}

function work2(cb, comparison, error, value) {
	if (error) return cb(error);

	switch (value.type) {
		case 'BOOLEAN':
			this.result = value.booleanValue;
			break;
		default:
			throw new Error('IF does not know how to evaluate ' + value.type + ' as a boolean::' + this.toString());
	}

	return cb(null, this);
}

function toString() {
	var ret = 'if (';
	ret += this.nodes[0].toString();
	ret += ')';
	return ret;
}

function toString() {
	return 'if (' + this.nodes[0].toString() + ')';
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

module.exports = {
	name: 'If',
	matches: function(command) {
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
		return false;
	},
	process: function(codeHandler, node, state, index, cb) {
		var command = node.tokenList;
		
		var conditional = new SyntaxTreeNode(node);
		conditional.strRep = 'conditional';
		if (command[index + 1].type != 'LEFT_PAREN') {
			throw new Error("Missing a left parenthesis after IF statement" + command[index + 1].type);
		}

		var res = goUntil(command, index + 3, +1, command.length, 'LEFT_PAREN', 'RIGHT_PAREN');
		conditional.tokenList = res.collection.reverse();
		node.addSubNode(conditional);

		node.work = work;
		node.strRep = 'If';
		node.toString = toString;
		node.type = 'If';
		node.tokenList = [];
		node.toString = toString;
		return cb('', node);
	}
};
