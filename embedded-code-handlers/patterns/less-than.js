var helper = require('../helper.js');
var ComparisonNode = require('../node-types/comparison-node.js');

module.exports = {
	name: 'Less than',
	matches: function(command) {
		for (var i = command.length - 1; i > 0; i--) {
			if (command[i].type == 'LEFT_ANGLE') {
				return i;
			}
		}
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		var node = new ComparisonNode(
			codeHandler,
			'<',
			function(a, b) {
				return parseInt(a) < parseInt(b);
			}
		);
		for (var i = 0; i < index; i++) {
			node.left.push(tokens[i]);
		}

		for (var i = index + 1; i < tokens.length; i++) {
			node.right.push(tokens[i]);
		}

		return cb('', node);
	}
};
