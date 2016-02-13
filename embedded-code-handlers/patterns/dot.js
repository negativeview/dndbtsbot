var helper             = require('../helper.js');
var SyntaxTreeNode     = require('../base/syntax-tree-node.js');
var ChannelNamespace   = require('../namespaces/channel-namespace.js');
var ServerNamespace    = require('../namespaces/server-namespace.js');
var UserNamespace      = require('../namespaces/user-namespace.js');
var CharacterNamespace = require('../namespaces/character-namespace.js');
var WeaponNamespace    = require('../namespaces/weapon-namespace.js');
var Variable           = require('../base/variable.js');
var DotNode            = require('../node-types/dot-node.js');

function toString() {
	return this.nodes[0].toString() + '.' + this.nodes[1].toString();
}

module.exports = {
	name: 'Dot',
	matches: function(command) {
		for (var i = command.length - 1; i > 0; i--) {
			if (command[i].type == 'DOT') {
				return i;
			}
		}
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		var node = new DotNode(codeHandler);

		for (var i = 0; i < index; i++) {
			node.left.push(tokens[i]);
		}
		for (var i = index + 1; i < tokens.length; i++) {
			node.right.push(tokens[i]);
		}
		return cb('', node);
	}
};
