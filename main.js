var DiscordClient = require('discord.io');

var diceHandler = require('./dice-handler.js');
var timeHandler = require('./time-handler.js');
var bot = require('./authenticate.js');

var usedTimezones = [];

for (i = -14; i < 0; i++) {
	usedTimezones[usedTimezones.length] = {
		code: 'Etc/GMT' + i,
		name: 'GMT+' + (-1 * i)
	};
}
usedTimezones[usedTimezones.length] = {
	code: 'Etc/GMT+0',
	name: 'GMT'
};
for (i = 1; i <= 12; i++) {
	usedTimezones[usedTimezones.length] = {
		code: 'Etc/GMT+' + i,
		name: 'GMT-' + i
	};
}

bot.on('ready', function() {
	console.log(bot.username + " - (" + bot.id + ")");
});

bot.on('message', function(user, userID, channelID, message, rawEvent) {
	if (message[0] == '!') {
		var pieces = message.split(" ");
		switch (pieces[0]) {
			case '!roll':
				diceHandler(pieces, rawEvent, bot, channelID);
				break;
			case '!time':
				timeHandler(pieces, rawEvent, bot, channelID);
				break;
			default:
				bot.sendMessage({
					to: channelID,
					message: 'Command: ' + pieces[0] + ' not recognized.'
				});
				break;
		}
	}
});

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}