var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var CodeError = require('../base/code-error.js');

function work(codeHandler, state, cb) {
	if (this.nodes.length != 1) {
		return cb('table expects one sub-node. How did this even happen??');
	}

	var messageA = null;
	var messageB = null;
	if (codeHandler.stateHolder.channelID in codeHandler.stateHolder.messages) {
		messageA = codeHandler.stateHolder.messages[codeHandler.stateHolder.channelID].message
	}
	if (codeHandler.stateHolder.username in codeHandler.stateHolder.messages) {
		messageB = codeHandler.stateHolder.messages[codeHandler.stateHolder.username].message
	}

	this.nodes[0].work(codeHandler, state, function(error, value) {
		if (error) return cb(error);

		codeHandler.stateHolder.executionHelper.handle('!table ' + value.strRep, function() {
			if (messageA) {
				codeHandler.stateHolder.messages[codeHandler.stateHolder.channelID] = messageA;
			} else {
				delete codeHandler.stateHolder.messages[codeHandler.stateHolder.channelID];
			}
			if (messageB) {
				codeHandler.stateHolder.messages[codeHandler.stateHolder.username] = messageB;
			} else {
				delete codeHandler.stateHolder.messages[codeHandler.stateHolder.username];
			}
			return cb();
		});
	});
}

module.exports = {
	name: 'Table',
	matches: function(command) {
		if (command.length == 1 && command[0].type == 'TABLE') return 0;
		return false;
	},
	process: function(codeHandler, node, state, index, cb) {
		if (index != 0) {
			throw new CodeError("Table does not return anything.", codeHandler, node);
		}

		var sub = [];
		for (var i = 1; i < node.tokenList.length; i++) {
			sub.push(node.tokenList[i]);
		}
		var leftNode = new SyntaxTreeNode(node);
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
