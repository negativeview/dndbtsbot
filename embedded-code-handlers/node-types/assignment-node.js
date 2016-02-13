var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var helper = require('../helper.js');

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
			console.log('assignment-node.execute.2');
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
			helper.recursiveVariable(
				result,
				codeState,
				(error, result) => {
					codeState.variables[variable.stringValue] = result;
					return cb(null, result);
				}
			);
			return;
		case 'VARIABLE':
			helper.convertToString(
				result,
				codeState,
				(error, stringValue) => {
					if (error) return cb(error);

					variable.assign(
						stringValue,
						() => {
							return cb(null, result);
						}
					);
				}
			);
			return;
		default:
			throw new Error(variable.type);
			break;
	}
};

module.exports = AssignmentNode;