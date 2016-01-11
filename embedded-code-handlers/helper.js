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

ret.doesMatch = function(command, matchDefinition, notEnding) {
	var length = command.length - matchDefinition.length;
	for (var i = 0; i <= length; i++) {
		var found = true;

		for (var m = 0; m < matchDefinition.length; m++) {
			if (matchDefinition[m].indexOf(command[i + m].type) == -1) {
				found = false;
				break;
			} 
		}

		if (found) {
			console.log('found', command, matchDefinition);
			if (notEnding) {
				var found2 = false;
				for (var n = 0; n < notEnding.length; n++) {
					if (notEnding[n].indexOf(command[i + m].type) == -1) {
						found2 = true;
						break;
					}
				}
				if (!found2) {
					console.log('unfound', command, matchDefinition, notEnding, command[i + m + 1]);
					continue;
				}
			}
			return i;
		}
	}

	return false;
}

module.exports = ret;