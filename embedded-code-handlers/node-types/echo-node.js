var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

var count = 0;

function EchoNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'ECHO';
	this.sub = [];
};
util.inherits(EchoNode, SyntaxTreeNode);

EchoNode.prototype.execute = function(parent, codeState, cb) {
	count++;

	if (count == 11) {
		//throw new Error('got here ' + count);
	}

	this.codeHandler.handleTokenList(
		(error, result) => {
			this.executeDone(cb, codeState, error, result);
		},
		codeState,
		null,
		this.sub
	);
};

EchoNode.prototype.executeDone = function(cb, codeState, error, result) {
	switch (result.type) {
		case 'ROLL_RESULT':
			this.codeHandler.stateHolder.simpleAddMessage(
				this.codeHandler.stateHolder.channelID, 
				result.output
			);
			return cb();			
		case 'QUOTED_STRING':
			this.codeHandler.stateHolder.simpleAddMessage(
				this.codeHandler.stateHolder.channelID, 
				result.stringValue
			);
			return cb();
		case 'VARIABLE':
			result.getScalarValue(
				(error, value) => {
					if (error) return cb(error);
					this.codeHandler.stateHolder.simpleAddMessage(
						this.codeHandler.stateHolder.channelID, 
						value
					);
					return cb();
				}
			);
			return;
		case 'BARE_STRING':
			if (result.stringValue in codeState.variables) {
				var toEcho = codeState.variables[result.stringValue];
				if (typeof(toEcho) == 'string') {
					this.codeHandler.stateHolder.simpleAddMessage(
						this.codeHandler.stateHolder.channelID, 
						codeState.variables[result.stringValue]
					);
				} else {
					return this.executeDone(cb, codeState, error, codeState.variables[result.stringValue]);
				}
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