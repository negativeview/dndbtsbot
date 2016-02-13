var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var IgnoreNode = require('../node-types/ignore-node.js');

module.exports = {
	name: 'Ignore',
	matches: function(command) {
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'IGNORE') {
				return i;
			}
		}
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		if (index != 0) {
			throw "Ignore does not return anything.";
		}

		var node = new IgnoreNode(codeHandler);
		for (var i = 1; i < tokens.length; i++) {
			node.sub.push(tokens[i]);
		}

		return cb('', node);
	}
};
