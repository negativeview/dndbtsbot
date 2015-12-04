module.exports = function() {
	var ret = {
		messages: {}
	};

	ret.init = function(mongoose, bot) {
		ret.mongoose = mongoose;
		ret.bot = bot;
	}

	ret.isAdmin = function(serverID, username) {
		var isAdmin = false;
		for (var i = 0; i < ret.bot.servers[serverID].members[username].roles.length; i++) {
			var roleID = ret.bot.servers[serverID].members[username].roles[i];

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