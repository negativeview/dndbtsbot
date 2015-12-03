var Dice = require('node-dice-js');

var ret = {
	macroModel: null
};

function isAdmin(bot, serverID, username) {
	var isAdmin = false;
	for (var i = 0; i < bot.servers[serverID].members[username].roles.length; i++) {
		var roleID = bot.servers[serverID].members[username].roles[i];

		var role = bot.servers[serverID].roles[roleID].name;

		if (role.toLocaleLowerCase() == 'moderator') {
			isAdmin = true;
			break;
		}
	}
	return isAdmin;
}

function findServerID(bot, channelID) {
	var serverID = null;
	for (var i in bot.servers) {
		for (var m in bot.servers[i].channels) {
			if (bot.servers[i].channels[m].id == channelID) {
				serverID = bot.servers[i].id;
				break;
			}
		}
		if (serverID) break;
	}
	return serverID;
}

ret.init = function(mongoose) {
	var Schema = mongoose.Schema;
	var AdminMacroSchema = new Schema({
		name: String,
		server: String,
		macro: String
	});
	mongoose.model('AdminMacro', AdminMacroSchema);

	ret.macroModel = mongoose.model('AdminMacro');
};

ret.set = function(pieces, message, rawEvent, bot, channelID, globalHandler) {
	var username = rawEvent.d.author.id;

	var serverID = findServerID(bot, channelID);
	if (!serverID) {
		bot.sendMessage({
			to: username,
			message: 'You must use this command from a channel so that I know what server to use.'
		});
		return;
	}

	var admin = isAdmin(bot, serverID, username);
	if (!admin) {
		bot.sendMessage({
			to: username,
			message: 'Only administrators can use this command.'
		});
	}

	if (pieces.length < 3) {
		bot.sendMessage({
			to: username,
			message: 'Invalid syntax trying to set an admin command.'
		});
		return;
	}

	var macroName = pieces[1];
	if (macroName[0] != '!') {
		macroName = '!' + macroName;
	}

	ret.macroModel.find({
		name: macroName
	}).exec(function(err, res) {
		if (err) {
			bot.sendMessage({
				to: username,
				message: err
			});
			return false;	
		}

		if (res.length) {
			for (var i = 0; i < res.length; i++) {
				var result = res[i];
				result.remove();
			}
		}

		var macroBody = '';
		for (var i = 2; i < pieces.length; i++) {
			macroBody += pieces[i] + ' ';
		}
		if (macroBody[0] != '!') {
			macroBody = '!' + macroBody;
		}

		var newMacro = new ret.macroModel(
			{
				name: macroName,
				server: serverID,
				macro: macroBody,
			}
		);
		newMacro.save(function(err) {
			if (err) {
				bot.sendMessage({
					to: username,
					message: 'Error saving macro: ' + err
				});
				return;
			} else {
				bot.sendMessage({
					to: username,
					message: 'Saved macro `' + macroName + '`'
				});
				return;				
			}
		});
	});
};

ret.remove = function(pieces, message, rawEvent, bot, channelID, globalHandler) {
	var username = rawEvent.d.author.id;

	var serverID = findServerID(bot, channelID);
	if (!serverID) {
		bot.sendMessage({
			to: username,
			message: 'You must use this command from a channel so that I know what server to use.'
		});
		return;
	}

	var admin = isAdmin(bot, serverID, username);
	if (!admin) {
		bot.sendMessage({
			to: username,
			message: 'Only administrators can use this command.'
		});
	}

	var macroName = pieces[1];
	if (macroName[0] != '!') {
		macroName = '!' + macroName;
	}

	ret.macroModel.find({
		name: macroName,
		server: serverID,
	}).exec(function(err, res) {
		if (err) {
			bot.sendMessage({
				to: username,
				message: err
			});
			return false;	
		}

		if (res.length) {
			for (var i = 0; i < res.length; i++) {
				var result = res[i];
				result.remove();
			}
		} else {
			bot.sendMessage({
				to: username,
				message: "Could not find the macro to remove."
			});
		}
	});	
};

ret.attempted = function(pieces, message, rawEvent, bot, channelID, globalHandler, next) {
	var username = rawEvent.d.author.id;

	var serverID = findServerID(bot, channelID);
	if (!serverID) {
		next(pieces, message, rawEvent, bot, channelID, globalHandler, null);
		return;
	}

	if (!serverID) return;

	ret.macroModel.find({
		name: pieces[0],
		server: serverID
	}).exec(function(err, res) {
		if (err) {
			bot.sendMessage({
				to: username,
				message: err
			});

			next(pieces, message, rawEvent, bot, channelID, globalHandler, null);
			return;
		}

		if (res.length) {
			var result = res[0];
			globalHandler('', '', channelID, result.macro, rawEvent);
			return;
		}

		next(pieces, message, rawEvent, bot, channelID, globalHandler, null);
		return;
	});
};

module.exports = ret;