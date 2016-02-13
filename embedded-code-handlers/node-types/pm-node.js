var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

var count = 0;

function PMNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'PM';
	this.sub = [];
};
util.inherits(PMNode, SyntaxTreeNode);

PMNode.prototype.execute = function(parent, codeState, cb) {
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

PMNode.prototype.executeDone = function(cb, codeState, error, result) {
	if (error) return cb(error);
	
	switch (result.type) {
		case 'ROLL_RESULT':
			this.codeHandler.stateHolder.simpleAddMessage(
				this.codeHandler.stateHolder.username, 
				result.output
			);
			return cb();			
		case 'QUOTED_STRING':
			this.codeHandler.stateHolder.simpleAddMessage(
				this.codeHandler.stateHolder.username, 
				result.stringValue
			);
			return cb();
		case 'VARIABLE':
			result.getScalarValue(
				(error, value) => {
					if (error) return cb(error);
					this.codeHandler.stateHolder.simpleAddMessage(
						this.codeHandler.username, 
						value
					);
					return cb();
				}
			);
			return;
		case 'BARE_STRING':
			if (result.stringValue in codeState.variables) {
				var toPM = codeState.variables[result.stringValue];
				if (typeof(toPM) == 'string') {
					this.codeHandler.stateHolder.simpleAddMessage(
						this.codeHandler.stateHolder.username, 
						codeState.variables[result.stringValue]
					);
				} else {
					return this.executeDone(cb, codeState, error, codeState.variables[result.stringValue]);
				}
			} else {
				this.codeHandler.stateHolder.simpleAddMessage(
					this.codeHandler.stateHolder.username, 
					''
				);			
			}
			return cb();
	}

	console.log(result);
	throw new Error('Do not know how to echo!');
};

module.exports = PMNode;