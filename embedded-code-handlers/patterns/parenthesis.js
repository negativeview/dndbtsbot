var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, cb) {
	if (this.nodes.length != 1) {
		return cb('() expects one sub-node. How did this even happen??');
	}

	var subNode = this.nodes[0];
	subNode.work(stateHolder, state, cb)
}

module.exports = {
	name: 'Parenthesis',
	matches: function(command) {
		var foundRight = false;
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'RIGHT_PAREN') {
				foundRight = true;
				var count = 0;

				for (var m = i - 1; m >= 0; m--) {
					if (command[m].type == 'LEFT_PAREN') {
						if (count == 0) {
							if (m != 0) {
								return false;
							}
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
	process: function(codeHandler, node, state, index, cb) {
		var insideArray = []

		var count = 0;
		for (var i = index + 1; i < node.tokenList.length; i++) {
			var token = node.tokenList[i];
			if (token.type == 'RIGHT_PAREN') {
				if (count == 0) {
					break;
				} else {
					count--;
				}
			} else if (token.type == 'LEFT_PAREN') {
				count++;
			}
			insideArray.push(token);
		}

		var inside = new SyntaxTreeNode();
		inside.tokenList = insideArray;

		node.type = 'PARENTHESIS';
		node.strRep = '()';
		node.addSubNode(inside);
		node.work = work;
		node.tokenList = [];

		return cb('', node);
	}
};
