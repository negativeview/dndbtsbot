var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var CodeError = require('../base/code-error.js');
var Dice = require('../../dice.js');

function work(stateHolder, state, cb) {
	if (this.nodes.length != 1) {
		return cb('roll expects one sub-node. How did this even happen??');
	}

	this.nodes[0].work(stateHolder, state, function(error, value) {
		if (error) return cb(error);

		console.log('roll value', value);

		var dice = new Dice();
		dice.execute(value.strRep, function(result) {
			console.log('value: ', result);
			var ret = new SyntaxTreeNode();
			ret.type = 'QUOTED_STRING';
			ret.strRep = result.output;
			return cb(null, ret);
		});
	});
}

module.exports = {
	name: 'Roll',
	matches: function(command) {
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'ROLL') {
				return i;
			}
		}
		return false;
	},
	process: function(codeHandler, node, state, index, cb) {
		if (index != 0) {
			throw new CodeError("Roll does not return anything.", node);
		}

		var sub = [];
		for (var i = 1; i < node.tokenList.length; i++) {
			sub.push(node.tokenList[i]);
		}
		var leftNode = new SyntaxTreeNode();
		leftNode.strRep = '';
		leftNode.tokenList = sub;

		node.type = 'ROLL';
		node.strRep = 'roll';
		node.addSubNode(leftNode);
		node.work = work;
		node.tokenList = [];

		return cb('', node);
	}
};
