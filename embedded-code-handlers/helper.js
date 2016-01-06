var block = require('../execution-block.js');

var ret = {};

ret.filterInt = function(value) {
  if(/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
    return Number(value);
  return NaN;
}

ret.fakeStateHolder = function(stateHolder) {
	var fakeStateHolder = Object.create(stateHolder);
	fakeStateHolder.result = '';
	fakeStateHolder.real = stateHolder;
	var b = block.create(stateHolder.mongoose, stateHolder.bot, fakeStateHolder);
	fakeStateHolder.block = b;

	fakeStateHolder.simpleAddMessage = function(to, message) {
		console.log('adding message ' + message + ' to a fake state holder.');
		fakeStateHolder.result += message;
	};
	fakeStateHolder.squashAddMessage = function(to, message) {
		console.log('squash add message');
	};
	fakeStateHolder.doFinalOutput = function() {
		console.log('doFinalOutput of a fake state holder!');
	};
	return fakeStateHolder;
};

ret.setHandlers = function(handlers) {
	ret.handlers = handlers;
}

ret.doesMatch = function(command, matchDefinition) {
	for (var i = 0; i <= command.length - matchDefinition.length; i++) {
		var found = true;

		for (var m = 0; m < matchDefinition.length; m++) {
			if (matchDefinition[m].indexOf(command[i + m].type) == -1) {
				found = false;
				break;
			} 
		}

		if (found) return i;
	}

	return false;
}

module.exports = ret;