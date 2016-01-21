var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var ParenthesisNode = require('../node-types/parenthesis-node.js');

module.exports = {
	name: 'Parenthesis',
	matches: function(command) {
		var foundRight = false;
		if (command[command.length-1].type != 'RIGHT_PAREN') return false;
		
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'RIGHT_PAREN') {
				foundRight = true;
				var count = 0;

				for (var m = i - 1; m >= 0; m--) {
					if (command[m].type == 'LEFT_PAREN') {
						if (count == 0) {
							return m;
						} else {
							count--;
						}
					} else if (command[m].type == 'RIGHT_PAREN') {
						count++;
					}
				}
			}
		}
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		var node = new ParenthesisNode(codeHandler);

		for (var i = 0; i < index; i++) {
			node.before.push(tokens[i]);
		}

		var count = 0;
		for (var i = index + 1; i < tokens.length; i++) {
			var token = tokens[i];
			if (token.type == 'RIGHT_PAREN') {
				if (count == 0) {
					break;
				} else {
					count--;
				}
			} else if (token.type == 'LEFT_PAREN') {
				count++;
			}
			node.sub.push(token);
		}

		return cb('', node);
	}
};
