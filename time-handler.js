var chrono = require('chrono-node');
var moment = require('moment-timezone');

var timestampByChannel = {};
var timezoneByUser = {};

var timezoneRefiner = new chrono.Refiner();
timezoneRefiner.refine = function(text, results, opt) {
	for (var i = 0; i < results.length; i++) {
		//console.log(results[0]);
		//console.log(results[0].start);
		//console.log(opt);
	}
	return results;
}

var custom = new chrono.Chrono();
custom.refiners.push(timezoneRefiner);

var ret = {};

function clearPendingDates(username) {
	ret.pendingdateModel.find({
		user: username
	}).exec(function(err, res) {
		for (var i = 0; i < res.length; i++) {
			res[i].remove();
		}
	});
}

ret.timezone = function(pieces, message, rawEvent, bot, channelID, globalHandler) {
	var username = rawEvent.d.author.id;
	var timezone = moment.tz.zone(pieces[1]);
	if (!timezone) {
		bot.sendMessage({
			to: username,
			message: 'Not a recognized timezone.'
		});
	}

	// Delete old timezones. We cannot have multiple.
	ret.timezoneModel.find({
		user: username
	}).exec(function(err, res) {
		if (err) {
			bot.sendMessage({
				to: 'negativeview',
				message: err
			});
			return;
		}

		for (var i = 0; i < res.length; i++) {
			res[i].remove();
		}

		var newTimezone = new ret.timezoneModel(
			{
				user: username,
				tz: pieces[1]
			}
		);
		newTimezone.save(function(err) {
			if (err) {
				bot.sendMessage({
					to: 'negativeview',
					message: err
				});
				return;
			}

			bot.sendMessage({
				to: username,
				message: 'Timezone stored. [TODO: Offer to re-send].'
			});
		});
	});
};

ret.parse = function(pieces, message, rawEvent, bot, channelID, globalHandler) {
	var username = rawEvent.d.author.id;

	var rawMessage = '';
	for (var i = 1; i < pieces.length; i++) {
		rawMessage += pieces[i];
		if (i != pieces.length-1) {
			rawMessage += ' ';
		}
	}

	ret.timezoneModel.find({
		user: username
	}).exec(function(err, res) {
		if (err) {
			bot.sendMessage({
				to: 'negativeivew',
				message: err
			});
			return;
		}

		if (res.length > 0) {
			var timezone = moment.tz.zone(res[0].tz);

			var referenceDate = null;
			console.log(moment.tz(res[0].tz).format('ddd MMM DD YYYY HH:mm:ss \\G\\M\\TZZ'));
			console.log(moment.tz(res[0].tz).toDate());
			var referenceDate = new Date(moment.tz(res[0].tz).format('ddd MMM DD YYYY HH:mm:ss \\G\\M\\TZZ'));
			console.log(referenceDate);



			var result = custom.parse(rawMessage, referenceDate);
			if (result.length > 0) {
				console.log(result[0]);
				console.log(result[0].start.date());
			} else {
				console.log('No results');
			}
		} else {
			clearPendingDates(username);

			bot.sendMessage({
				to: username,
				message: 'You do not have a timezone set up, so I cannot parse your time correctly. You can say `!timezone <TIMEZONE>` to set your timezone.'
			});

			var timezoneNames = moment.tz.names();
			var message = '';
			for (var i = 0; i < timezoneNames.length; i++) {
				var oldMessage = message;
				if (message != '') {
					message += ', ';
				}
				message += timezoneNames[i];

				if (message.length > 2000) {
					i = i - 1;
					bot.sendMessage({
						to: username,
						message: oldMessage
					});
					message = '';
				}
			}

			if (message != '') {
				bot.sendMessage({
					to: username,
					message: message
				});				
			}
		}
	});

	console.log('Evaluating: ' + rawMessage);

	var result = custom.parse(rawMessage, null, {'timeObject': ret});
}

ret.init = function(mongoose) {
	var Schema = mongoose.Schema;

	var TimezoneSchema = new Schema({
		user: String,
		tz: String
	});
	mongoose.model('Timezone', TimezoneSchema);
	ret.timezoneModel = mongoose.model('Timezone');

	var PendingDateSchema = new Schema({
		user: String,
		channel: String,
		time: String
	});
	mongoose.model('PendingDate', PendingDateSchema);
	ret.pendingdateModel = mongoose.model('PendingDate');
};

module.exports = ret;