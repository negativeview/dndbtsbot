var helper             = require('../helper.js');
var SyntaxTreeNode     = require('../base/syntax-tree-node.js');
var ChannelNamespace   = require('../namespaces/channel-namespace.js');
var ServerNamespace    = require('../namespaces/server-namespace.js');
var UserNamespace      = require('../namespaces/user-namespace.js');
var CharacterNamespace = require('../namespaces/character-namespace.js');
var WeaponNamespace    = require('../namespaces/weapon-namespace.js');
var Variable           = require('../base/variable.js');

function work(stateHolder, state, node, cb) {
	if (node.nodes.length != 2) {
		throw new Error('. expects two sub-nodes. How did this even happen??');
	}

	var leftNode = node.nodes[0];
	leftNode.work(stateHolder, state, leftNode, function(error, value) {
		if (error) return cb(error);

		var leftHandSide = value;

		node.nodes[1].work(stateHolder, state, node.nodes[1], function(error, value) {
			try {
				var rightHandSide = value;

				console.log('in dot', leftHandSide, rightHandSide);

				if (leftHandSide.type == "STRING") {
					switch (leftHandSide.strRep) {
						case 'channel':
							var namespace = new ChannelNamespace(stateHolder);
							break;
						case 'server':
							var namespace = new ServerNamespace(stateHolder);
							break;
						case 'user':
						case 'me':
							var namespace = new UserNamespace(stateHolder);
							break;
						case 'character':
							var namespace = new CharacterNamespace(stateHolder);
							break;
						case 'weapon':
							var namespace = new WeaponNamespace(stateHolder);
							break;
						default:
							return cb(leftHandSide + ' not recognized as a namespace that variables can live in.');
					}
				}

				var variable = new Variable(namespace, rightHandSide.strRep);
				cb(null, variable);
			} catch (e) {
				return cb(e.stack);
			}
		});
	});
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
	process: function(node, state, index, cb) {
		var left = [];
		var right = [];

		for (var i = 0; i < index; i++) {
			left.push(node.tokenList[i]);
		}
		var leftNode = new SyntaxTreeNode();
		leftNode.strRep = '';
		leftNode.tokenList = left;

		for (var i = index + 1; i < node.tokenList.length; i++) {
			right.push(node.tokenList[i]);
		}
		var rightNode = new SyntaxTreeNode();
		rightNode.strRep = '';
		rightNode.tokenList = right;

		node.type = 'parsed';
		node.strRep = '.';
		node.addSubNode(leftNode);
		node.addSubNode(rightNode);
		node.work = work;
		node.tokenList = [];

		return cb('', node);
	}
};
