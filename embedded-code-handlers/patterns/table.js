var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var CodeError = require('../base/code-error.js');
var TableNode = require('../node-types/table-node.js');

module.exports = {
	name: 'Table',
	matches: function(command) {
		if (command.length == 1 && command[0].type == 'TABLE') return 0;
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		var node = new TableNode(codeHandler);
		return cb('', node);
	}
};
