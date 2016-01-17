var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, node, cb) {
	if (node.nodes.length != 2) {
		return cb('+ expects two sub-nodes. How did this even happen??');
	}

	var leftNode = node.nodes[0];

	console.log('calling work', leftNode);
	leftNode.work(stateHolder, state, leftNode, function(error, value) {
		console.log('got back from work', value);
		if (error) return cb(error);

		if (!value) {
			console.log('no-left-plus', error, value);
			throw new Error('+ was not given a left value.');
		}

		var leftValue = value.strRep;

		node.nodes[1].work(stateHolder, state, node.nodes[1], function(error, value) {
			if (error) return cb(error);

			var rightValue = value.strRep;

			if (typeof(leftValue) == 'string') {
				if (node.nodes[0].simpleString) {
					leftValue = state.variables[leftValue];
				}
			}

			if (typeof(rightValue) == 'string') {
				if (node.nodes[1].simpleString) {
					rightValue = state.variables[rightValue];
				}
			}

			return cb(null, leftValue + rightValue);
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
