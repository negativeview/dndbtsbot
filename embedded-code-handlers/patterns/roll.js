var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var CodeError = require('../base/code-error.js');
var Dice = require('../../dice.js');

function work(codeHandler, state, cb) {
	if (this.nodes.length != 1) {
		return cb('roll expects one sub-node. How did this even happen??');
	}

	this.nodes[0].work(codeHandler, state, function(error, value) {
		if (error) return cb(error);

		var dice = new Dice();
		dice.execute(value.strRep, function(result) {
			var ret = new SyntaxTreeNode();
			ret.type = 'QUOTED_STRING';
			ret.strRep = result.output;
			return cb(null, ret);
		});
	});
}

function toString() {
	return 'roll(' + this.nodes[0].toString() + ')';
}

module.exports = {
	name: 'Roll',
	matches: function(command) {
		if (command.length == 1 && command[0].type == 'ROLL') return 0;
		return false;
	},
	process: function(codeHandler, node, state, index, cb) {
		if (index != 0) {
			throw new CodeError("Roll does not return anything.", codeHandler, node);
		}

		var sub = [];
		for (var i = 1; i < node.tokenList.length; i++) {
			sub.push(node.tokenList[i]);
		}
		var leftNode = new SyntaxTreeNode(node);
		leftNode.strRep = '';
		leftNode.tokenList = sub;

		node.type = 'ROLL';
		node.strRep = 'roll';
		node.addSubNode(leftNode);
		node.work = work;
		node.tokenList = [];
		node.toString = toString;

		return cb('', node);
	}
};
