var helper             = require('../helper.js');
var SyntaxTreeNode     = require('../base/syntax-tree-node.js');
var ChannelNamespace   = require('../namespaces/channel-namespace.js');
var ServerNamespace    = require('../namespaces/server-namespace.js');
var UserNamespace      = require('../namespaces/user-namespace.js');
var CharacterNamespace = require('../namespaces/character-namespace.js');
var WeaponNamespace    = require('../namespaces/weapon-namespace.js');
var Variable           = require('../base/variable.js');
var SquareBracketNode  = require('../node-types/square-bracket-node.js');

function work(codeHandler, state, cb) {
	if (typeof(cb) != 'function') throw new Error('cb is not a function' + typeof(cb));
	if (this.nodes.length != 2) {
		throw new Error('. expects two sub-nodes. How did this even happen??');
	}

	var leftNode = this.nodes[0];
	leftNode.work(codeHandler, state, work2.bind(this, cb, codeHandler, state));
}

function work2(cb, codeHandler, state, error, value) {
	if (error) return cb(error);

	var leftHandSide = value;
	var rightNode = this.nodes[1];
	rightNode.work(codeHandler, state, work3.bind(this, cb, leftHandSide, codeHandler));
}

function work3(cb, leftHandSide, codeHandler, error, value) {
	var rightHandSide = value;

	if (leftHandSide.type == "STRING") {
		switch (leftHandSide.strRep) {
			case 'channel':
				var namespace = new ChannelNamespace(codeHandler.stateHolder);
				break;
			case 'server':
				var namespace = new ServerNamespace(codeHandler.stateHolder);
				break;
			case 'user':
			case 'me':
				var namespace = new UserNamespace(codeHandler.stateHolder);
				break;
			case 'character':
				var namespace = new CharacterNamespace(codeHandler.stateHolder);
				break;
			case 'weapon':
				var namespace = new WeaponNamespace(codeHandler.stateHolder);
				break;
			default:
				return cb(leftHandSide + ' not recognized as a namespace that variables can live in.');
		}
	}

	var variable = new Variable(namespace, rightHandSide.strRep);
	cb(null, variable);
}

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
		var node = new SquareBracketNode(codeHandler);

		for (var i = 0; i < index; i++) {
			node.left.push(tokens[i]);
		}
		for (var i = index + 1; i < tokens.length; i++) {
			node.right.push(tokens[i]);
		}
		return cb('', node);
	}
};
