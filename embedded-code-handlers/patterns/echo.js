var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, node, cb) {
	if (node.nodes.length != 1) {
		return cb('echo excepts one sub-nodes. How did this even happen??');
	}

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
	name: 'Echo',
	matches: function(command) {
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'ECHO') {
				return i;
			}
		}
		return false;
	},
	process: function(node, state, index, cb) {
		if (index != 0) {
			throw "Echo does not return anything.";
		}

		node.type = 'parsed';
		node.strRep = 'echo';

		var sub = [];
		for (var i = 1; i < node.tokenList.length; i++) {
			sub.push(node.tokenList[i]);
		}

		var childStn = new SyntaxTreeNode();
		childStn.tokenList = sub;

		node.addSubNode(childStn);
		node.work = work;

		return cb('', node);
	}
};
