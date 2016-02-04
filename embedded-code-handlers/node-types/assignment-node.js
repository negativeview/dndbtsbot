var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function AssignmentNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'ASSIGNMENT';
	this.left = [];
	this.right = [];
};
util.inherits(AssignmentNode, SyntaxTreeNode);

AssignmentNode.prototype.execute = function(parent, codeState, cb) {
	this.codeHandler.handleTokenList(
		(error, result) => {
			this.leftDone(cb, codeState, error, result);
		},
		codeState,
		null,
		this.left
	);
};

AssignmentNode.prototype.leftDone = function(cb, codeState, error, result) {
	if (error) return cb(error);

	this.codeHandler.handleTokenList(
		(error, result2) => {
			this.rightDone(cb, codeState, result, error, result2);
		},
		codeState,
		null,
		this.right
	);
};

AssignmentNode.prototype.rightDone = function(cb, codeState, variable, error, result) {
	if (error) return cb(error);
	
	switch (variable.type) {
		case 'BARE_STRING':
			switch (result.type) {
				case 'QUOTED_STRING':
					codeState.variables[variable.stringValue] = result.stringValue;
					return cb(null, result);
				case 'ROLL_RESULT':
					codeState.variables[variable.stringValue] = result;
					return cb(null, result);
				case 'BARE_STRING':
					if (!isNaN(parseInt(result.stringValue))) {
						codeState.variables[variable.stringValue] = result.stringValue;
						return cb(null, result);
					} else {
						if (result.stringValue in codeState.variables) {
							codeState.variables[variable.stringValue] = codeState.variables[result.stringValue];
							return cb(null, result);
						} else {
							throw new Error(result.stringValue + ' is not previously a variable');
						}
					}
				default:
					throw new Error(result.type);
					break;
			}
			break;
		case 'VARIABLE':
			switch (result.type) {
				case 'QUOTED_STRING':
					variable.assign(result.stringValue, function() {
						cb(null, result);
					});
					break;
				default:
					throw new Error(result.type);
			}
			break;
		default:
			throw new Error(variable.type);
			break;
	}
};

module.exports = AssignmentNode;