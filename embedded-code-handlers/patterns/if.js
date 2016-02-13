var helper = require('../helper.js');
var IfNode = require('../node-types/if-node.js');

function toString() {
	return 'if (' + this.nodes[0].toString() + ')';
}

module.exports = {
	name: 'If',
	matches: function(command) {
		if (command.length == 1 && command[0].type == 'IF') return 0;
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		var node = new IfNode(codeHandler);
		return cb('', node);
	}
};
