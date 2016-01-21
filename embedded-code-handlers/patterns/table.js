var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var CodeError = require('../base/code-error.js');
var TableNode = require('../node-types/table-node.js');

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
	process: function(codeHandler, tokens, state, index, cb) {
		var node = new TableNode(codeHandler);
		return cb('', node);
	}
};
