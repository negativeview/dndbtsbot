var helper = require('../helper.js');
var SemicolonNode = require('../node-types/semicolon-node.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

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
	process: function(codeHandler, tokens, state, index, cb) {
		var left = [];
		var right = [];

		var node = new SemicolonNode(codeHandler);
		for (var i = 0; i < index; i++) {
			node.left.push(tokens[i]);
		}
		for (var i = index + 1; i < tokens.length; i++) {
			node.right.push(tokens[i]);
		}

		return cb('', node);
	}
};
