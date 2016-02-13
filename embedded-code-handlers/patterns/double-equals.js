var helper = require('../helper.js');
var ComparisonNode = require('../node-types/comparison-node.js');

function toString() {
	return this.nodes[0].toString() + ' == ' + this.nodes[1].toString();
}

module.exports = {
	name: 'Double Equals',
	matches: function(command) {
		for (var i = command.length - 1; i > 0; i--) {
			if (command[i].type == 'DOUBLE_EQUALS') {
				return i;
			}
		}
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		var node = new ComparisonNode(
			codeHandler,
			'==',
			function(a, b) {
				return a == b;
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
