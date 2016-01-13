function StateHolder(messageQueue, user, bot, mongoose, userID, channelID, rawEvent) {
	this.messages = {};
	this.channelID = channelID;
	this.username = rawEvent.d.author.id;
	this.actualUsername = user;
	this.adminDetermined = false;
	this._isAdmin = false;
	this.serverID = bot.serverFromChannel(channelID);
	this.mongoose = mongoose;
	this.verified = true;
	this.bot = bot;
	this.stack = [];
	this.messageQueue = messageQueue;
};

StateHolder.prototype.memberNumberToName = function(number) {
	if (number in this.bot.servers[this.serverID].members) {
		return this.bot.servers[this.serverID].members[number].user.username;
	}
	return number;
};

StateHolder.prototype.isAdmin = function(username) {
	if (this.adminDetermined) return this._isAdmin;

	var server = this.bot.servers[this.serverID];
	if (!server) return false;

	var theUser = server.members[username];
	if (!theUser) return false;

	for (var i = 0; i < theUser.roles.length; i++) {
		var roleID = theUser.roles[i];
		var role = this.bot.servers[this.serverID].roles[roleID].name;
		if (role.toLocaleLowerCase() == 'moderator') {
			this._isAdmin = true;
			break;
		}
	}

	this.adminDetermined = true;
	return this._isAdmin;
};

StateHolder.prototype.simpleAddMessage = function(to, message) {
	if (!(to in this.messages)) {
		this.messages[to] = {
			to: to,
			message: ''
		};
	}

	if (this.messages[to].message.length > 0) {
		if (this.messages[to].message[this.messages[to].message.length - 1] != "\n") {
			this.messages[to].message += " ";
		}
	}
	this.messages[to].message += message;
};

StateHolder.prototype.squashAddMessage = function(to, message) {
	if (!(to in this.messages)) {
		this.messages[to] = {
			to: to,
			message: ''
		};
	}

	this.messages[to].message += message;
};

StateHolder.prototype.doFinalOutput = function() {
	var unicodeIcons = {
		star: '\u2605',
		skullAndCrossbones: '\u2620',
		frowningFace: '\u2639',
		smilingFace: '\u263A',
		crossedSwords: '\u2694'
	};

	for (var i in this.messages) {
		var outputType = this.messages[i];

		var channelID = this.channelID;
		if (this.serverID) {
			outputType.message =
				(this.verified ? ':game_die: ' : '') +
				this.memberNumberToName(this.username) +
				': ' +
				outputType.message;
		}

		var priority = 1;
		if (this.priority) priority = this.priority;

		this.messageQueue.addAction(priority, 'sendMessage', outputType);
	}
};

module.exports = StateHolder;