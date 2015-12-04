var ret = {
	macroModel: null
};

function isAdmin(stateHolder, serverID, username) {
	var isAdmin = false;
	for (var i = 0; i < stateHolder.bot.servers[serverID].members[username].roles.length; i++) {
		var roleID = stateHolder.bot.servers[serverID].members[username].roles[i];

		var role = stateHolder.bot.servers[serverID].roles[roleID].name;

		if (role.toLocaleLowerCase() == 'moderator') {
			isAdmin = true;
			break;
		}
	}
	return isAdmin;
}

function findServerID(stateHolder, channelID) {
	var serverID = null;
	for (var i in stateHolder.bot.servers) {
		for (var m in stateHolder.bot.servers[i].channels) {
			if (stateHolder.bot.servers[i].channels[m].id == channelID) {
				serverID = stateHolder.bot.servers[i].id;
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

ret.set = function(pieces, message, rawEvent, channelID, globalHandler, stateHolder, next) {
	var username = rawEvent.d.author.id;

	var serverID = findServerID(stateHolder, channelID);
	if (!serverID) {
		stateHolder.simpleAddMessage(username, 'You must use this command from a channel so that I know what server to use.');
		return next();
	}

	var admin = isAdmin(stateHolder, serverID, username);
	if (!admin) {
		stateHolder.simpleAddMessage(username, 'Only administrators can use this command.');
		return next();
	}

	if (pieces.length < 3) {
		stateHolder.simpleAddMessage(username, 'Invalid syntax trying to set an admin command.');
		return next();
	}

	var macroName = pieces[1];
	if (macroName[0] != '!') {
		macroName = '!' + macroName;
	}

	ret.macroModel.find({
		name: macroName
	}).exec(function(err, res) {
		if (err) {
			stateHolder.simpleAddMessage(username, err);
			return next();
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
				stateHolder.simpleAddMessage(username, 'Error saving macro: ' + err);
				return next();
			} else {
				stateHolder.simpleAddMessage(username, 'Saved macro `' + macroName + '`');
				return next();
			}
		});
	});
};

ret.remove = function(pieces, message, rawEvent, channelID, globalHandler, stateHolder, next) {
	var username = rawEvent.d.author.id;

	var serverID = findServerID(stateHolder, channelID);
	if (!serverID) {
		stateHolder.simpleAddMessage(username, 'You must use this command from a channel.');
		return next();
	}

	var admin = isAdmin(stateHolder, serverID, username);
	if (!admin) {
		stateHolder.simpleAddMessage(username, 'Only administrators can use this command.');
		return next();
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
			stateHolder.simpleAddMessage(username, err);
			return next();
		}

		if (res.length) {
			for (var i = 0; i < res.length; i++) {
				var result = res[i];
				result.remove();
			}
		} else {
			stateHolder.simpleAddMessage(username, 'Could not find the macro to remove.');
			return next();
		}
	});	
};

ret.attempted = function(pieces, message, rawEvent, channelID, globalHandler, stateHolder, next, nextnext) {
	var username = rawEvent.d.author.id;

	var serverID = findServerID(stateHolder, channelID);
	if (!serverID) {
		next(pieces, message, rawEvent, channelID, globalHandler, stateHolder, nextnext);
		return;
	}

	if (!serverID) return;

	ret.macroModel.find({
		name: pieces[0],
		server: serverID
	}).exec(function(err, res) {
		if (err) {
			stateHolder.simpleAddMessage(username, err);
			next(pieces, message, rawEvent, channelID, globalHandler, stateHolder, nextnext);
			return;
		}

		if (res.length) {
			var result = res[0];
			globalHandler('', '', channelID, result.macro, rawEvent, stateHolder, nextnext);
			return;
		}

		next(pieces, message, rawEvent, channelID, globalHandler, stateHolder, nextnext);
		return;
	});
};

module.exports = ret;