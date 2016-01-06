var DiscordClient = require('./discord.io/lib/index.js');

module.exports = new DiscordClient({
	email: 'email',
	password: 'password',
	autorun: false
});

