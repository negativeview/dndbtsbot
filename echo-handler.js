module.exports = function(pieces, message, rawEvent, bot, channelID, globalHandler) {
	var message = '';

	for (var i = 1; i < pieces.length; i++) {
		message += pieces[i] + ' ';
	}

	bot.sendMessage({
		to: channelID,
		message: message
	});
};
