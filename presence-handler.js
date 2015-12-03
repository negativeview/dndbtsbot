
var ret = {};

ret.presence = function(user, userID, status, rawEvent) {
	ret.presenceModel.find({
		user: user
	}).exec(function(err, res) {
		if (err) return;

		if (res.length > 0) return;

		var newPresence = new ret.presenceModel(
			{
				user: user
			}
		);
		newPresence.save(function(err) {
			if (err) return;

			console.log('Attempting to send a greeting message.');
			var channel = null;

			for (var i in ret.bot.servers) {
				for (var m in ret.bot.servers[i].channels) {
					if (ret.bot.servers[i].channels[m].position == 0) {
						channel = ret.bot.servers[i].channels[m].id;
						break;
					}
				}
				break;
			}
			console.log(channel);
			if (channel) {
				ret.bot.sendMessage({
					to: channel,
					message: 'Welcome, ' + user + ' to the server!'
				});
			}
		});
	});
};

ret.init = function(mongoose, bot) {
	var Schema = mongoose.Schema;

	var PresenceSchema = new Schema({
		user: String,
	});
	mongoose.model('Presence', PresenceSchema);
	ret.presenceModel = mongoose.model('Presence');
	ret.bot = bot;
};

module.exports = ret;