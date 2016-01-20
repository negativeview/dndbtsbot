var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, cb) {
	if (typeof(cb) != 'function') throw new Error('cb is not a function: ', typeof(cb));

	var leftNode = this.nodes[0];
	if (typeof(leftNode.work) != 'function') {
		throw new Error('Node not processed correctly');
	}

	leftNode.work(stateHolder, state, work2.bind(this, cb, stateHolder, state));
}

function work2(cb, stateHolder, state, error, value) {
	if (error) return cb(error);

	if (this.nodes.length > 1) {
		if (this.nodes[1].type == 'unparsed-node-list' && this.nodes[1].tokenList.length == 0) return cb();

		var rightNode = this.nodes[1];
		rightNode.work(stateHolder, state, work3.bind(this, cb));
	} else {
		return cb();
	}
}

function work3(cb, error, value) {
	if (error) return cb(error);
	return cb(null, value);
}

function toString() {
	var ret = '';
	if (this.nodes[0]) {
		ret += this.nodes[0].toString();
	}
	ret += ';';
	if (this.nodes[1]) {
		ret += this.nodes[1].toString();
	}

	return ret;
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
	process: function(codeHandler, node, state, index, cb) {
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

		node.type = 'SEMICOLON';
		node.strRep = ';';
		node.addSubNode(leftNode);
		node.toString = toString;

		if (rightNode.tokenList.length)
			node.addSubNode(rightNode);
		
		node.work = work;
		node.tokenList = [];

		return cb('', node);
	}
};
