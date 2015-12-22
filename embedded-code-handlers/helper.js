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
	fakeStateHolder.simpleAddMessage = function(to, message) {
		fakeStateHolder.result += message;
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