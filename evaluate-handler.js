var ret = {

};

ret.evaluate = function(pieces, message, rawEvent, channelID, globalHandler, stateHolder, next) {
	console.log('in evaluate: ' + globalHandler.getMessage(channelID))
	var commandToRun = '';
	if (stateHolder.overrideEvaluationMessage) {
		commandToRun = stateHolder.overrideEvaluationMessage;
	} else {
		commandToRun = stateHolder.getMessage(channelID);
		stateHolder.clearMessages(channelID);
	}
	globalHandler('', '', channelID, commandToRun, rawEvent, stateHolder, next);
}

module.exports = ret;