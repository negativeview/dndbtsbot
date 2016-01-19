var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, cb) {
	if (this.nodes.length != 1) {
		return cb('table expects one sub-node. How did this even happen??');
	}

	var messageA = null;
	var messageB = null;
	if (stateHolder.channelID in stateHolder.messages) {
		messageA = stateHolder.messages[stateHolder.channelID].message
	}
	if (stateHolder.username in stateHolder.messages) {
		messageB = stateHolder.messages[stateHolder.username].message
	}
	return cb();



	node.nodes[0].work(stateHolder, state, node.nodes[0], function(error, value) {
		if (error) return cb(error);

		stateHolder.executionHelper.handle('!table ' + value, stateHolder, function() {
			if (messageA) {
				stateHolder.messages[stateHolder.channelID] = messageA;
			} else {
				delete stateHolder.messages[stateHolder.channelID];
			}
			if (messageB) {
				stateHolder.messages[stateHolder.username] = messageB;
			} else {
				delete stateHolder.messages[stateHolder.username];
			}
			return cb();
		});
	});
}

module.exports = {
	name: 'Echo',
	matches: function(command) {
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'TABLE') {
				return i;
			}
		}
		return false;
	},
	process: function(node, state, index, cb) {
		if (index != 0) {
			throw "Table does not return anything.";
		}

		var sub = [];
		for (var i = 1; i < node.tokenList.length; i++) {
			sub.push(node.tokenList[i]);
		}
		var leftNode = new SyntaxTreeNode();
		leftNode.strRep = '';
		leftNode.tokenList = sub;

		node.type = 'TABLE';
		node.strRep = 'table';
		node.addSubNode(leftNode);
		node.work = work;
		node.tokenList = [];

		return cb('', node);
	}
};
