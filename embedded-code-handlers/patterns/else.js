var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(codeHandler, state, cb) {
	var retNode = new SyntaxTreeNode();
	retNode.type = 'BOOLEAN';
	retNode.strRep = this.booleanValue ? 'true' : 'false';
	retNode.result = this.booleanValue;

	return cb(null, retNode);
}

function toString() {
	return ' else ';
}

module.exports = {
	name: 'Else',
	matches: function(command) {
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'ELSE') {
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
		var leftNode = new SyntaxTreeNode(node);
		leftNode.tokenList = left;

		for (var i = index + 1; i < node.tokenList.length; i++) {
			right.push(node.tokenList[i]);
		}
		var rightNode = new SyntaxTreeNode(node);
		rightNode.tokenList = right;

		node.type = 'ELSE';
		node.strRep = '=';
		node.addSubNode(leftNode);
		node.addSubNode(rightNode);
		node.work = work;
		node.tokenList = [];
		node.toString = toString;

		return cb('', node);
	}
};