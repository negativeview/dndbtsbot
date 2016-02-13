var helper = require('../helper.js');
var ArgumentNode = require('../node-types/argument-node.js');
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
		if (command.length == 1 && command[0].type == 'MACRO_ARGUMENT') return 0;
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		var token = tokens[0];
		var matches = token.rawValue.match(/\{([0-9]+)(\+?)\}/);
		if (!matches) {
			throw new Error('Invalid macro argument: ' + token.rawValue);
		}

		var argument = matches[1];
		if (matches.length > 2) {
			argument += matches[2];
		}

		var node = new ArgumentNode(codeHandler, argument);
		return cb('', node);
	}
};
