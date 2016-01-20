var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(stateHolder, state, cb) {
	if (this.nodes.length != 1) {
		return cb('echo excepts one sub-nodes. How did this even happen??');
	}

	var subNode = this.nodes[0];
	subNode.work(stateHolder, state, function(error, value) {
		if (error) {
			return cb(error);
		}

		if (value.type == 'VARIABLE') {
			value.getScalarValue(
				function(error, res) {
					stateHolder.simpleAddMessage(stateHolder.channelID, res);
					return cb();
				}
			);
			return;
		} else if (value.type == 'QUOTED_STRING') {
			stateHolder.simpleAddMessage(stateHolder.channelID, value.strRep);
			return cb();
		} else if (value.type == 'STRING') {
			stateHolder.simpleAddMessage(stateHolder.channelID, state.variables[value.strRep]);
			return cb();
		} else {
			throw new Error('Do not know how to echo a ' + value.type + ', expecting a variable or a QUOTED_STRING');
		}
	});
}

function toString() {
	return 'echo ' + this.nodes[0].toString();
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

		node.type = 'ECHO';
		node.strRep = 'echo';

		var sub = [];
		for (var i = 1; i < node.tokenList.length; i++) {
			sub.push(node.tokenList[i]);
		}

		var childStn = new SyntaxTreeNode();
		childStn.tokenList = sub;

		node.addSubNode(childStn);
		node.work = work;
		node.tokenList = [];
		node.toString = toString;

		return cb('', node);
	}
};
