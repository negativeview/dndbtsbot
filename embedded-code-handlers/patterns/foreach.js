var helper = require('../helper.js');
var ForeachNode = require('../node-types/foreach-node.js');

module.exports = {
	name: 'Foreach',
	matches: function(command) {
		if (command.length == 1 && command[0].type == 'FOREACH') return 0;
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		var node = new ForeachNode(codeHandler);
		return cb('', node);
	}
};
