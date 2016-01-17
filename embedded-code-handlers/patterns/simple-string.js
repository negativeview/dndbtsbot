var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, node, cb) {
	console.log('in simple string node:::', node);
	return cb(null, node);
}

module.exports = {
	name: 'Simple String',
	matches: function(command) {
		if (command.length != 1) return false;
		if (command[0].type == 'QUOTED_STRING') return 0;
		if (command[0].type == 'STRING') return 0;
		return false;
	},
	process: function(node, state, index, cb) {
		node.strRep = node.tokenList[index].rawValue;
		node.work = work;
		node.type = node.tokenList[index].type;
		node.simpleString = node.tokenList[index].type == 'STRING';
		node.tokenList = [];

		return cb('', node);
	}
};
