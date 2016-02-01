var helper = require('../helper.js');
var ComparisonNode = require('../node-types/comparison-node.js');

module.exports = {
	name: 'Boolean AND',
	matches: function(command) {
		for (var i = command.length - 1; i > 0; i--) {
			if (command[i].type == 'BOOLEAN_AND') {
				return i;
			}
		}
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		var node = new ComparisonNode(
			codeHandler,
			'&&',
			function(a, b) {
				if (a == 'false') a = false;
				if (b == 'false') b = false;

				var ret = a && b;

				console.log(a, '&&', b, ret);
				return ret;
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
