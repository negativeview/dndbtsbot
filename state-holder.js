module.exports = function(user, userID, channelID, rawEvent) {
	var ret = {
		messages: {},
		contextUser: null,
		channelID: channelID,
		username: rawEvent.d.author.id,
		actualUsername: user
	};

	ret.init = function(mongoose, bot, block) {
		ret.mongoose = mongoose;
		ret.bot = bot;
		ret.block = block;
	}

	ret.clone = function() {
		var ret2 = module.exports(user, userID, channelID, rawEvent);
		ret2.init(ret.mongoose, ret.bot, ret.block);
		return ret2;
	}

	ret.memberNumberToName = function(serverID, number) {
		if (number in ret.bot.servers[serverID].members) {
			return ret.bot.servers[serverID].members[number].user.username;
		}
		return number;
	}

	ret.memberNameToNumber = function(serverID, username) {
		for (var userID in ret.bot.servers[serverID].members) {
			var user = ret.bot.servers[serverID].members[userID];
			if (user.user.username == username) {
				return user.user.id;
			}
		}
		return username;
	}

	ret.isAdmin = function(serverID, username) {
		var isAdmin = false;
		var server = ret.bot.servers[serverID];
		if (!server) {
			return false;
		}

		var theUser = server.members[username];
		if (!theUser) {
			return false;
		}

		for (var i = 0; i < theUser.roles.length; i++) {
			var roleID = theUser.roles[i];
			var role = ret.bot.servers[serverID].roles[roleID].name;
			if (role.toLocaleLowerCase() == 'moderator') {
				isAdmin = true;
				break;
			}
		}
		return isAdmin;
	}

	ret.findServerID = function(channelID) {
		var serverID = ret.bot.serverFromChannel(channelID);
		return serverID;
	}

	ret.doFinalOutput = function() {
		for (var i in ret.messages) {
			var outputType = ret.messages[i];

			var channelID = ret.channelID;
			if (channelID) {
				var serverID = ret.findServerID(channelID);
				if (serverID) {
					outputType.message = ret.memberNumberToName(serverID, ret.username) + ': ' + outputType.message;
				}
			}
			ret.bot.sendMessage(outputType);
		}
	};

	ret.getMessage = function(to) {
		var message = ret.messages[to];
		if (message)
			return message.message;
		return '';
	}

	ret.clearMessages = function(to) {
		delete ret.messages[to];
	}

	ret.simpleAddMessage = function(to, message) {
		if (!(to in ret.messages)) {
			ret.messages[to] = {
				to: to,
				message: ''
			};
		}

		if (ret.messages[to].message.length > 0) {
			if (ret.messages[to].message[ret.messages[to].message.length-1] != "\n") {
				ret.messages[to].message += " ";
			}
		}
		ret.messages[to].message += message;
	}

	return ret;
}