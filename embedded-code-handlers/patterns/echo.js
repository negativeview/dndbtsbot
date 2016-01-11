var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, node, cb) {
	if (node.nodes.length != 1) {
		return cb('echo excepts one sub-nodes. How did this even happen??');
	}

	node.nodes[0].work(stateHolder, state, node.nodes[0], function(error, value) {
		if (error) return cb(error);

		var leftHandSide = value;

		stateHolder.simpleAddMessage(stateHolder.channelID, leftHandSide);

		return cb();
	});
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
	process: function(command, state, index, cb) {
		if (index != 0) {
			throw "Echo does not return anything.";
		}

		var sub = [];
		for (var i = 1; i < command.length; i++) {
			sub.push(command[i]);
		}

		var stn = new SyntaxTreeNode();
		stn.strRep = 'echo';
		stn.addSubTree(sub);
		stn.work = work;

		return cb('', stn);
	}
};
