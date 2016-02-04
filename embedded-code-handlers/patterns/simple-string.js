var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var StringNode = require('../node-types/string-node.js');
var BareStringNode = require('../node-types/bare-string-node.js');

function work(codeHandler, state, cb) {
	return cb(null, this);
}

function toString() {
	if (this.type == 'QUOTED_STRING') return '"' + this.strRep + '"';
	return this.strRep;
}

module.exports = {
	name: 'Simple String',
	matches: function(command) {
		if (command.length != 1) return false;
		if (command[0].type == 'QUOTED_STRING') return 0;
		if (command[0].type == 'BARE_STRING') return 0;
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		if (tokens[index].type == 'QUOTED_STRING') {
			var ret = new StringNode(codeHandler, tokens[index].rawValue);
		} else {
			var ret = new BareStringNode(codeHandler, tokens[index].rawValue);
		}
		return cb('', ret);
	}
};
