var ret = {

};

ret.evaluate = function(pieces, message, rawEvent, channelID, globalHandler, stateHolder, next) {
	var commandToRun = stateHolder.getMessage(channelID);
	stateHolder.clearMessages(channelID);
	globalHandler('', '', channelID, commandToRun, rawEvent, stateHolder, next);
}

module.exports = ret;