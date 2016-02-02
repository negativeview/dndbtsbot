var async = require('async');
var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function CurlyBracesNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'CURLY_BRACES';
	this.left = [];
	this.inside = [];
	this.right = [];
};
util.inherits(CurlyBracesNode, SyntaxTreeNode);

CurlyBracesNode.prototype.execute = function(parent, codeState, cb) {
	this.codeHandler.handleTokenList(
		(error, result) => {
			this.leftDone(cb, codeState, error, result);
		},
		codeState,
		null,
		this.left
	);
};

CurlyBracesNode.prototype.foreachAsync = function(codeState, index, cb) {
	codeState.variables.key = index.key;
	codeState.variables.value = index.value;

	this.codeHandler.handleTokenList(
		(error, result) => {
			return cb();
		},
		codeState,
		null,
		this.inside
	);
}

CurlyBracesNode.prototype.leftDone = function(cb, codeState, error, result) {
	if (error) return cb(error);

	console.log('leftDone', result.type);

	if (result) {
		switch (result.type) {
			case 'IF':
			case 'CURLY_BRACES':
				if ('booleanValue' in result) {
					this.booleanValue = result.booleanValue;
					
					if (this.booleanValue) {
						this.codeHandler.handleTokenList(
							(error, result) => {
								this.insideDone(cb, codeState, error, result);
							},
							codeState,
							null,
							this.inside
						);
					} else {
						this.codeHandler.handleTokenList(
							(error, result) => {
								this.afterDone(cb, codeState, error, result);
							},
							codeState,
							null,
							this.right,
							this
						);
					}
				} else {
					console.log('No boolean value in ', result);
					this.insideDone(cb, codeState, null, result);
				}
				return;
			case 'FOREACH':
				if (result.loopValue) {
					//console.log('Foreach with loop value:', result.loopValue);
					//throw new Error('bomb');
					result.loopValue.getTable(
						(error, table) => {
							async.eachSeries(
								table,
								(index, cb) => {
									this.foreachAsync(codeState, index, cb);
								},
								(result) => {
									this.insideDone(cb, codeState, null, result);
								}
							);
						}
					);
				}
				break;
			default:
				throw new Error('Not a known result type:' + result.type);
		}
	} else if ('booleanValue' in codeState.programNode) {
		if (codeState.programNode.booleanValue) {
			delete codeState.programNode.booleanValue;
			this.codeHandler.handleTokenList(
				(error, result) => {
					this.insideDone(cb, codeState, error, result)
				},
				codeState,
				null,
				this.inside
			);
		} else {
			delete codeState.programNode.booleanValue;
			this.insideDone(cb, codeState, null, result);
		}
	} else {
		console.log(codeState.programNode.booleanValue);
		throw new Error('Got to this BS place.');
	}
};

CurlyBracesNode.prototype.insideDone = function(cb, codeState, error, result) {
	if (result) {
		switch (result.type) {
			case 'IF':
				this.booleanValue = result.booleanValue;
		}
	}

	if (this.right.length == 0) return cb(null, this);

	this.codeHandler.handleTokenList(
		(error, result) => {
			this.afterDone(cb, codeState, error, result);
		},
		codeState,
		null,
		this.right,
		this
	);
};

CurlyBracesNode.prototype.afterDone = function(cb, codeState, error, result) {
	return cb(error, result);
}

module.exports = CurlyBracesNode;