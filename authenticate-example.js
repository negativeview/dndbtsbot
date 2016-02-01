var DiscordClient = require('./discord.io/lib/index.js');

module.exports = {
	bot: new DiscordClient({
		email: 'email',
		password: 'password',
		autorun: false
	}),
	webURL: 'http://192.168.33.10'
};