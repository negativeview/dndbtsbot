var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function EchoNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'ECHO';
	this.sub = [];
};
util.inherits(EchoNode, SyntaxTreeNode);

EchoNode.prototype.execute = function(parent, codeState, cb) {
	this.codeHandler.handleTokenList(
		this.executeDone.bind(this, cb, codeState),
		codeState,
		null,
		this.sub
	);
};

EchoNode.prototype.executeDone = function(cb, codeState, error, result) {
	switch (result.type) {
		case 'QUOTED_STRING':
			this.codeHandler.stateHolder.simpleAddMessage(
				this.codeHandler.stateHolder.channelID, 
				result.stringValue
			);
			return cb();
		case 'VARIABLE':
			var m = this;
			result.getScalarValue(function(error, value) {
				if (error) return cb(error);
				m.codeHandler.stateHolder.simpleAddMessage(
					m.codeHandler.stateHolder.channelID, 
					value
				);
				return cb();
			});
			return;
		case 'BARE_STRING':
			if (result.stringValue in codeState.variables) {
				this.codeHandler.stateHolder.simpleAddMessage(
					this.codeHandler.stateHolder.channelID, 
					codeState.variables[result.stringValue]
				);
			} else {
				this.codeHandler.stateHolder.simpleAddMessage(
					this.codeHandler.stateHolder.channelID, 
					''
				);			
			}
			return cb();
	}

	console.log(result);
	throw new Error('Do not know how to echo!');
};

module.exports = EchoNode;