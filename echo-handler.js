var ret = {

};

ret.echo = function(pieces, message, rawEvent, channelID, globalHandler, stateHandler, next) {
	var message = '';

	for (var i = 1; i < pieces.length; i++) {
		message += pieces[i] + ' ';
	}

	stateHandler.simpleAddMessage(channelID, message);
	next();
};

ret.echon = function(pieces, message, rawEvent, channelID, globalHandler, stateHandler, next) {
	stateHandler.simpleAddMessage(channelID, "\n");
	next();
};

ret.pm = function(pieces, message, rawEvent, channelID, globalHandler, stateHandler, next) {
	var message = '';

	for (var i = 1; i < pieces.length; i++) {
		message += pieces[i] + ' ';
	}

	stateHandler.simpleAddMessage(channelID, message);
	next();
};

module.exports = ret;