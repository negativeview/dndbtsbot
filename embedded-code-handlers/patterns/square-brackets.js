var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var SquareBracketNode = require('../node-types/square-bracket-node.js');

module.exports = {
	name: 'Square Brackets',
	matches: function(command) {
		if (command[command.length - 1].type != 'RIGHT_BRACKET') {
			return false;
		}

		var bracketCount = 0;
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'RIGHT_BRACKET') {
				bracketCount++;
			} else if (command[i].type == 'LEFT_BRACKET') {
				bracketCount--;
				if (bracketCount == 0) return i;
			}
		}
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		var node = new SquareBracketNode(codeHandler);

		var left = [];
		var right = [];

		for (var i = 0; i < index; i++) {
			node.left.push(tokens[i]);
		}

		var bracketCount = 1;
		for (var i = index + 1; i < tokens.length; i++) {
			switch(tokens[i].type) {
				case 'LEFT_BRACKET':
					bracketCount++;
					break;
				case 'RIGHT_BRACKET':
					bracketCount--;
					if (bracketCount == 0) {
						//node.right.push(tokens[i]);
						return cb('', node);
					}
					break;
			}
			node.right.push(tokens[i]);
		}

		return cb('', node);
	}
};
