var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var ChannelNamespace = require('../namespaces/channel-namespace.js');
var ServerNamespace = require('../namespaces/server-namespace.js');
var Variable = require('../base/variable.js');

function DotNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'DOT';
	this.left = [];
	this.right = [];
};
util.inherits(DotNode, SyntaxTreeNode);

DotNode.prototype.execute = function(parent, codeState, cb) {
	this.codeHandler.handleTokenList(
		this.leftDone.bind(this, cb, codeState),
		codeState,
		null,
		this.left
	);
};

DotNode.prototype.leftDone = function(cb, codeState, error, result) {
	var namespace = null;

	switch (result.type) {
		case 'BARE_STRING':
			switch (result.stringValue) {
				case 'channel':
					namespace = new ChannelNamespace(this.codeHandler.stateHolder);
					break;
				case 'server':
					namespace = new ServerNamespace(this.codeHandler.stateHolder);
					break;
			}
			break;
		default:
			throw new Error('Not sure what to do with ' + result.type);
	}

	if (namespace) {
		this.codeHandler.handleTokenList(
			this.rightDone.bind(this, cb, namespace),
			codeState,
			null,
			this.right
		);
	} else {
		throw new Error('No namespace.');
	}
};

DotNode.prototype.rightDone = function(cb, namespace, error, result) {
	switch (result.type) {
		case 'BARE_STRING':
			var variable = new Variable(namespace, result.stringValue);
			return cb(null, variable);
		default:
			throw new Error('Bad');
	}
};

module.exports = DotNode;