var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var EchoNode = require('../node-types/echo-node.js');

module.exports = {
	name: 'Echo',
	matches: function(command) {
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'ECHO') {
				return i;
			}
		}
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		if (index != 0) {
			throw "Echo does not return anything.";
		}

		var node = new EchoNode(codeHandler);
		for (var i = 1; i < tokens.length; i++) {
			node.sub.push(tokens[i]);
		}

		return cb('', node);
	}
};
