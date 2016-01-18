var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, cb) {
	if (this.nodes.length != 2) {
		return cb('+ expects two sub-nodes. How did this even happen??');
	}

	var leftNode = this.nodes[0];
	leftNode.work(stateHolder, state, function(error, value) {
		if (error) return cb(error);

		if (!value) {
			throw new Error('+ was not given a left value.');
		}

		var leftValue = value;

		var rightNode = this.nodes[1];
		rightNode.work(stateHolder, state, function(error, value) {
			if (error) return cb(error);

			var rightValue = value;

			if (leftValue.type == 'STRING') {
				leftValue = state.variables[leftValue.strRep];
			} else if (leftValue.type == 'QUOTED_STRING') {
				leftValue = leftValue.strRep;
			} else {
				throw new Error('Left value of + is not a known type of value: ' + leftValue.type);
			}

			if (rightValue.type == 'STRING') {
				rightValue = state.variables[rightValue.strValue];
			} else if (rightValue.type == 'QUOTED_STRING') {
				rightValue = rightValue.strRep;
			} else {
				throw new Error('Right value of + is not a known type of value: ' + rightValue.type);
			}

			var returnNode = new SyntaxTreeNode();
			returnNode.type = 'QUOTED_STRING';
			returnNode.strRep = leftValue + rightValue;

			return cb(null, returnNode);
		});
	});

	return;

	var subNode = node.nodes[0];
	if (subNode.work) {
		subNode.work(stateHolder, state, subNode, function(error, value) {
			if (error) {
				console.log(error);
				return cb(error);
			}

			if (value.type == 'variable') {
				value.getScalarValue(
					function(error, res) {
						if (error) return cb(error);
						
						stateHolder.simpleAddMessage(stateHolder.channelID, res);
						return cb();
					}
				);
				return;
			}
			stateHolder.simpleAddMessage(stateHolder.channelID, value);
			return cb();
		});
	} else {
		stateHolder.simpleAddMessage(stateHolder.channelID, subNode.strRep);
		return cb();
	}
}

module.exports = {
	name: 'Plus',
	matches: function(command) {
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'PLUS') {
				return i;
			}
		}
		return false;
	},
	process: function(node, state, index, cb) {
		node.type = 'PLUS';
		node.strRep = '+';

		var left = new SyntaxTreeNode();
		for (var i = 0; i < index; i++) {
			left.tokenList.push(node.tokenList[i]);
		}
		node.addSubNode(left);

		var right = new SyntaxTreeNode();
		for (var i = index + 1; i < node.tokenList.length; i++) {
			right.tokenList.push(node.tokenList[i]);
		}
		node.addSubNode(right);
		node.work = work;

		return cb('', node);
	}
};
