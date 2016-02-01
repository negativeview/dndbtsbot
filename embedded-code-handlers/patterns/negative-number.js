var helper = require('../helper.js');
var StringNode = require('../node-types/string-node.js');

module.exports = {
	name: 'Negative Number',
	matches: function(command) {
		if (command.length != 2) return false;
		if (command[0].type != 'MINUS') return false;
		if (command[1].type != 'STRING') return false;
		return true;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		var node = new StringNode(codeHandler, '-' + tokens[1].stringValue);
		return cb('', node);
	}
};
