var helper = require('../helper.js');
var RollNode = require('../node-types/roll-node.js');

module.exports = {
	name: 'Roll',
	matches: function(command) {
		console.log('Trying to match', command);
		if (command.length == 1 && command[0].type == 'ROLL') return 0;
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		var node = new RollNode(codeHandler);
		return cb('', node);
	}
};
