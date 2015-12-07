var ret = {

};

ret.evaluate = function(pieces, stateHolder, next) {
	var commandToRun = '';
	if (stateHolder.overrideEvaluationMessage) {
		commandToRun = stateHolder.overrideEvaluationMessage;
	} else {
		commandToRun = stateHolder.getMessage(stateHolder.channelID);
		stateHolder.clearMessages(stateHolder.channelID);
	}

	var splitMessages = commandToRun.split("\n");
	
	var currentMessage = splitMessages[0];
	for (var i = 1; i < splitMessages.length; i++) {
		if (splitMessages[i][0] != '!') {
			currentMessage += "\n" + splitMessages[i]
		} else {
			stateHolder.block.addStatement(currentMessage);
			currentMessage = splitMessages[i];
		}
	}
	stateHolder.block.addStatement(currentMessage);
	return next();
}

module.exports = ret;