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
	stateHolder.block.addStatement(commandToRun);
	return next();
}

module.exports = ret;