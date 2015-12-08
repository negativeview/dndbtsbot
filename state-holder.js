module.exports = function(user, userID, channelID, rawEvent) {
	var ret = {
		messages: {},
		contextUser: null,
		channelID: channelID,
		username: rawEvent.d.author.id
	};

	ret.init = function(mongoose, bot, block) {
		ret.mongoose = mongoose;
		ret.bot = bot;
		ret.block = block;
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
		var theUser = ret.bot.servers[serverID].members[username];
		if (!theUser) {
			console.log(username + ' not found as a username.');
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
		var serverID = null;
		for (var i in ret.bot.servers) {
			for (var m in ret.bot.servers[i].channels) {
				if (ret.bot.servers[i].channels[m].id == channelID) {
					serverID = ret.bot.servers[i].id;
					break;
				}
			}
			if (serverID) break;
		}
		return serverID;
	}

	ret.doFinalOutput = function() {
		for (var i in ret.messages) {
			var outputType = ret.messages[i];
			ret.bot.sendMessage(outputType);
		}
	};

	ret.getMessage = function(to) {
		return ret.messages[to].message;
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