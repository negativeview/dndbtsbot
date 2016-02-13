var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var Dice = require('../../dice.js');
var RollResult = require('../base/roll-result.js');

function RollNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'ROLL';
};
util.inherits(RollNode, SyntaxTreeNode);

RollNode.prototype.execute = function(parent, codeState, cb) {
	return cb(null, this);
};

RollNode.prototype.executeString = function(stringValue, cb) {
	var executionHelper = this.codeHandler.stateHolder.executionHelper;
	var m = this;
	var dice = new Dice();

	dice.execute(
		stringValue,
		(error, data) => {
			if (error) return cb(error);
			var rollResult = new RollResult(data);
			return cb(null, rollResult);
		}
	);
};

module.exports = RollNode;