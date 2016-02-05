var helper = require('../helper.js');
var PlusNode = require('../node-types/plus-node.js');

function toString() {
	return this.nodes[0].toString() + ' + ' + this.nodes[1].toString();
}

module.exports = {
	name: 'Plus',
	matches: function(command) {
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'PLUS') {
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
		var node = new PlusNode(codeHandler);
		for (var i = 0; i < index; i++) {
			node.left.push(tokens[i]);
		}

		for (var i = index + 1; i < tokens.length; i++) {
			node.right.push(tokens[i]);
		}

		return cb('', node);
	}
};
