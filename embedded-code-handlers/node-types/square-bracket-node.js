var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var ChannelNamespace = require('../namespaces/channel-namespace.js');

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
		default:
			throw new Error('Not sure what to do with ' + result.type);
	}
};

SquareBracketNode.prototype.rightDone = function(cb, codeState, variable, error, result) {
	switch (result.type) {
		case 'QUOTED_STRING':
			variable.index = result.stringValue;
			return cb(null, variable);
			break;
		case 'BARE_STRING':
			if (result.stringValue in codeState.variables) {
				variable.index = codeState.variables[result.stringValue];
			} else if (parseInt(result.stringValue) != NaN) {
				variable.index = parseInt(result.stringValue);
			} else {
				variable.index = '';
			}
			return cb(null, variable);
			break;
		default:
			console.log(result);
			throw new Error('Not sure what to do with ' + result.type);
			break;
	}
};

module.exports = SquareBracketNode;