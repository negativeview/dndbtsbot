var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var CodeError = require('../base/code-error.js');

function work(codeHandler, state, cb) {
	var syntaxTreeNode = new SyntaxTreeNode();
	syntaxTreeNode.type = 'QUOTED_STRING';
	syntaxTreeNode.strRep = state.args[this.matches[1]];
	return cb(null, syntaxTreeNode);
}

function toString() {
	var ret = '{' + this.matches[1] + '}';
	return ret;
}

module.exports = {
	name: 'Macro',
	matches: function(command) {
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'MACRO_ARGUMENT') {
				return i;
			}
		}
		return false;
	},
	process: function(codeHandler, node, state, index, cb) {
		if (node.tokenList.length != 1) {
			throw new CodeError('Macro argument was not by itself when parsing.', codeHandler, node);
		}
		var token = node.tokenList[index];

		var matches = token.rawValue.match(/\{([0-9]+)(\+?)\}/);
		node.rawValue = token.rawValue;
		if (matches) {
			node.matches = matches;
		}
		node.strRep = 'macro argument';
		node.work = work;
		node.tokenList = [];
		node.type = 'MACRO_ARGUMENT';
		node.toString = toString;

		return cb('', node);
	}
};
