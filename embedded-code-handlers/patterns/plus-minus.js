var helper = require('../helper.js');
var PlusMinusNode = require('../node-types/plus-minus-node.js');

module.exports = {
	name: 'PlusMinus',
	matches: function(command) {
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'PLUS' || command[i].type == 'MINUS') {
				var l = 0;
				var r = 0;
				for (var m = i; m >= 0; m--) {
					if (command[m].type == 'LEFT_PAREN') l++;
					if (command[m].type == 'RIGHT_PAREN') r++;
				}
				if (r == l) return i;
			}
		}
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		var node = new PlusMinusNode(codeHandler, tokens[index].type);
		for (var i = 0; i < index; i++) {
			node.left.push(tokens[i]);
		}

		for (var i = index + 1; i < tokens.length; i++) {
			node.right.push(tokens[i]);
		}

		return cb('', node);
	}
};
