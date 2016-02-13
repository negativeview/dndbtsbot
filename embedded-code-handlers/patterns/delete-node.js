var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var DeleteNode = require('../node-types/delete-node.js');

module.exports = {
	name: 'Delete',
	matches: function(command) {
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'DELETE') {
				return i;
			}
		}
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		if (index != 0) {
			throw "Delete does not return anything.";
		}

		var node = new DeleteNode(codeHandler);
		for (var i = 1; i < tokens.length; i++) {
			node.sub.push(tokens[i]);
		}

		return cb('', node);
	}
};
