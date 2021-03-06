var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var ChannelNamespace = require('../namespaces/channel-namespace.js');
var CharacterNamespace = require('../namespaces/character-namespace.js');
var UserNamespace = require('../namespaces/user-namespace.js');
var ServerNamespace = require('../namespaces/server-namespace.js');
var Variable = require('../base/variable.js');
var StringNode = require('./string-node.js');
var helper = require('../helper.js');

function DotNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'DOT';
	this.left = [];
	this.right = [];
};
util.inherits(DotNode, SyntaxTreeNode);

DotNode.prototype.execute = function(parent, codeState, cb) {
	this.codeHandler.handleTokenList(
		(error, result) => {
			if (error) return cb(error);
			
			this.leftDone(cb, codeState, error, result)
		},
		codeState,
		null,
		this.left
	);
};

DotNode.prototype.leftDone = function(cb, codeState, error, result) {
	var namespace = null;

	switch (result.type) {
		case 'VARIABLE':
			this.codeHandler.handleTokenList(
				(error, result2) => {
					if (error) return cb(error);

					helper.convertToString(
						result,
						codeState,
						(error, result3) => {
							if (error) return cb(error);

							result.setIndex(result3);

							return cb(null, result);
						}
					);
				},
				codeState,
				null,
				this.right
			);
			return;
		case 'BARE_STRING':
			switch (result.stringValue) {
				case 'channel':
					namespace = new ChannelNamespace(this.codeHandler.stateHolder);
					break;
				case 'server':
					namespace = new ServerNamespace(this.codeHandler.stateHolder);
					break;
				case 'user':
					namespace = new UserNamespace(this.codeHandler.stateHolder);
					break;
				case 'character':
					namespace = new CharacterNamespace(this.codeHandler.stateHolder);
					break;
			}
			if (namespace) {
				this.codeHandler.handleTokenList(
					(error, result) => {
						this.rightDone(cb, namespace, error, result);
					},
					codeState,
					null,
					this.right
				);
			} else if (codeState.variables[result.stringValue]) {
				return this.leftDone(cb, codeState, error, codeState.variables[result.stringValue]);
			} else {
				throw new Error('No namespace.');
			}
			break;
		case 'ROLL_RESULT':
			this.codeHandler.handleTokenList(
				(error, result2) => {
					if (error) return cb(error);

					switch (result2.type) {
						case 'BARE_STRING':
							if (result2.stringValue in result) {
								var stringNode = new StringNode(this.codeHandler, result[result2.stringValue]);
								return cb(null, stringNode);
							} else {
								var stringNode = new StringNode(this.codeHandler, '');
								return cb(null, stringNode);
							}
							break;
						default:
							throw new Error('Bad');
					}
				},
				codeState,
				null,
				this.right
			)
			break;
		default:
			throw new Error('Not sure what to do with ' + result.type);
	}

};

DotNode.prototype.rightDone = function(cb, namespace, error, result) {
	if (error) return cb(error);

	switch (result.type) {
		case 'BARE_STRING':
			console.log('BARE_STRING', namespace, result.stringValue);
			var variable = new Variable(namespace, result.stringValue);
			return cb(null, variable);
		default:
			throw new Error('Bad');
	}
};

module.exports = DotNode;