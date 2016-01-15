var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, node, cb) {
	return cb(null, state.args[node.matches[1]]);
}

module.exports = {
	name: 'Macro',
	matches: function(command) {
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'MACRO_ARGUMENT') {
				return i;
			}
		}
		return false;
	},
	process: function(node, state, index, cb) {
		var token = node.tokenList[0];

		var matches = token.rawValue.match(/\{([0-9]+)(\+?)\}/);
		node.matches = matches;
		node.strRep = 'macro argument';
		node.work = work;
		node.tokenList = [];
		node.type = 'parsed';

		return cb('', node);
	}
};
