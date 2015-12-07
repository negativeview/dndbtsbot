var ret = {

};

ret.echo = function(pieces, stateHandler, next) {
	var message = '';

	for (var i = 1; i < pieces.length; i++) {
		message += pieces[i] + ' ';
	}

	stateHandler.simpleAddMessage(stateHandler.channelID, message);
	next();
};

ret.echon = function(pieces, stateHandler, next) {
	stateHandler.simpleAddMessage(stateHandler.channelID, "\n");
	next();
};

ret.pm = function(pieces, stateHandler, next) {
	var message = '';

	for (var i = 1; i < pieces.length; i++) {
		message += pieces[i] + ' ';
	}

	stateHandler.simpleAddMessage(stateHandler.username, message);
	next();
};

module.exports = ret;