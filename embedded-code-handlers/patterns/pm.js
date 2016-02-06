var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var PMNode = require('../node-types/pm-node.js');

module.exports = {
	name: 'PM',
	matches: function(command) {
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'PM') {
				return i;
			}
		}
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		if (index != 0) {
			throw "PM does not return anything.";
		}

		var node = new PMNode(codeHandler);
		for (var i = 1; i < tokens.length; i++) {
			node.sub.push(tokens[i]);
		}

		return cb('', node);
	}
};
