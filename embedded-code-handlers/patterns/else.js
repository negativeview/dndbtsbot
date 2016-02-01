var helper = require('../helper.js');
var ElseNode = require('../node-types/else-node.js');

function toString() {
	return ' else ';
}

module.exports = {
	name: 'Else',
	matches: function(command) {
		if (command.length == 1 && command[0].type == 'ELSE') return 0;
		return false;
		
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'ELSE') return i;
		}
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		var node = new ElseNode(codeHandler);
		for (var i = 0; i < index; i++) {
			node.before.push(tokens[i]);
		}
		for (var i = i + 1; i < tokens.length; i++) {
			node.after.push(tokens[i]);
		}
		return cb('', node);
	}
};