var async  = require('async');
var helper = require('../helper.js');
var CurlyBracesNode = require('../node-types/curly-braces-node.js');

function toString() {
	var ret = '';

	ret += this.nodes[0].toString();
	ret += '{' + this.nodes[1].toString() + '}';
	if (this.nodes[2].type != 'unparsed-node-list')
		ret += this.nodes[2].toString();

	return ret;
}

module.exports = {
	name: 'Curly Braces',
	wasIf: false,
	booleanValue: false,
	matches: function(command) {
		var foundRight = false;
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'RIGHT_CURLY') {
				foundRight = true;
				var count = 0;

				for (var m = i - 1; m >= 0; m--) {
					if (command[m].type == 'LEFT_CURLY') {
						if (count == 0) {
							return m;
						} else {
							count--;
						}
					} else if (command[m].type == 'RIGHT_CURLY') {
						count++;
					}
				}
			}
		}
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		var node = new CurlyBracesNode(codeHandler);

		for (var i = 0; i < index; i++) {
			node.left.push(tokens[i]);
		}

		var count = 0;
		for (var i = index + 1; i < tokens.length; i++) {
			var token = tokens[i];
			if (token.type == 'RIGHT_CURLY') {
				if (count == 0) {
					break;
				} else {
					count--;
				}
			} else if (token.type == 'LEFT_CURLY') {
				count++;
			}
			node.inside.push(token);
		}

		for (i = i + 1; i < tokens.length; i++) {
			node.right.push(tokens[i]);
		}
		return cb('', node);
	}
};
