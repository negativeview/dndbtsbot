var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var ChannelNamespace = require('../namespaces/channel-namespace.js');
var helper = require('../helper.js');

function SquareBracketNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'SQUARE_BRACKET';
	this.left = [];
	this.right = [];
};
util.inherits(SquareBracketNode, SyntaxTreeNode);

SquareBracketNode.prototype.execute = function(parent, codeState, cb) {
	this.codeHandler.handleTokenList(
		(error, result) => {
			if (error) return cb(error);

			this.leftDone(cb, codeState, null, result);
		},
		codeState,
		null,
		this.left
	);
};

SquareBracketNode.prototype.leftDone = function(cb, codeState, error, result) {
	if (error) return cb(error);

	switch (result.type) {
		// When is this a thing?
		case 'NAMESPACE':
			switch (result.stringValue) {
				case 'channel':
					var namespace = new ChannelNamespace(this.codeHandler.stateHolder);
					return cb(null, namespace);
					break;
			}
			break;
		case 'VARIABLE':
			this.codeHandler.handleTokenList(
				(error, result2) => {
					this.rightDone(cb, codeState, result, error, result2);
				},
				codeState,
				null,
				this.right
			);
			break;
		case 'BARE_STRING':
			switch (result.stringValue) {
				case 'character':
					break;
				default:
					throw new Error(result.stringValue + ' is not a special variable name.');
			}
			break;
		default:
			throw new Error('Not sure what to do with ' + result.type);
	}
};

SquareBracketNode.prototype.rightDone = function(cb, codeState, variable, error, result) {
	helper.convertToString(
		result,
		codeState,
		(error, stringValue) => {
			if (error) return cb(error);
			variable.index = stringValue;

			console.log('variable', variable);
			return cb(null, variable);
		}
	);
};

module.exports = SquareBracketNode;