var helper = require('../helper.js');
var AsteriskNode = require('../node-types/asterisk-node.js');

module.exports = {
	name: 'Asterisk',
	matches: function(command) {
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'ASTERISK') {
				return i;
			}
		}
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		var node = new AsteriskNode(codeHandler);
		for (var i = 0; i < index; i++) {
			node.left.push(tokens[i]);
		}

		for (var i = index + 1; i < tokens.length; i++) {
			node.right.push(tokens[i]);
		}

		return cb('', node);
	}
};
