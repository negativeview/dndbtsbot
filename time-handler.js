var moment = require('moment-timezone');

var timestampByChannel = {};
var timezoneByUser = {};

module.exports = function(pieces, rawEvent, bot, channelID) {
	var username = rawEvent.d.author.username;

	switch (pieces.length) {
		case 1:
			// Only '!time'. We want to use all the info from all the things.
			if (username in timezoneByUser) {
				var timezone = timezoneByUser[username];

				if (channelID in timestampByChannel) {
					var timestamp = timestampByChannel[channelID];
					bot.sendMessage({
						to: channelID,
						message: '@' + username + ' `' + timestamp.tz(timezone).format('MMM Do YY h:mm a') + '`'
					});
					return;
				} else {
					bot.sendMessage({
						to: channelID,
						message: '@' + username + ' `There is no active timestamp for this channel.`'
					});
					return;
				}
			} else {
				bot.sendMessage({
					to: channelID,
					message: '@' + username + ' `You do not have a timezone set up. Type `!time <Timezone>` to set it`'
				});
				return;
			}
			break;
		case 2:
			// !time timestamp
			var timezoneNames = moment.tz.names();
			if (timezoneNames.indexOf(pieces[1]) !== -1) {
				timezoneByUser[username] = pieces[1];
				bot.sendMessage({
					to: channelID,
					message: '@' + username + ' `Set your timezone to ' + pieces[1] + '`'
				});
				return;
			} else {
				bot.sendMessage({
					to: channelID,
					message: '@' + username + ' `I do not recognize that timezone (' + pieces[1] + ')`'
				});
				return;
			}
			break;
		default:
			var time = '';
			for (var i = 1; i < pieces.length - 1; i++) {
				time += pieces[i] + " ";
			}

			var tz = pieces[pieces.length-1];
			var datestr = time + tz;
			var d = Date.parse(datestr);
			var a = moment.tz(d, tz);

			timestampByChannel[channelID] = a;

			var message = 'Stored timestamp. To convert it into another timezone, use `!time` or `!time <timezone>`';

			bot.sendMessage({
				to: channelID,
				message: '@' + username + ' ' + message
			});
			break;
	}
};