var ret = {
	macroModel: null
};

ret.init = function(mongoose) {
	var Schema = mongoose.Schema;
	var MacroSchema = new Schema({
		name: String,
		user: String,
		macro: String
	});
	mongoose.model('Macro', MacroSchema);

	ret.macroModel = mongoose.model('Macro');

	var AdminMacroSchema = new Schema({
		name: String,
		server: String,
		macro: String
	});
	mongoose.model('AdminMacro', AdminMacroSchema);

	ret.adminMacroModel = mongoose.model('AdminMacro');
};

ret.get = function(isAdmin, pieces, stateHolder, next) {
	var model = isAdmin ? ret.adminMacroModel : ret.macroModel;
	var params = {};
	if (isAdmin) params.server = stateHolder.serverID;
	if (!isAdmin) params.user = stateHolder.username;

	model.find(params).exec(function(err, res) {
		if (err) {
			stateHolder.simpleAddMessage(stateHolder.username, err);
			return next();	
		}

		var answerMessage = '';
		if (res.length > 0) {
			for (var i = 0; i < res.length; i++) {
				answerMessage += '`' + res[i].name + '` ' + res[i].macro;
				if (i != res.length-1) {
					answerMessage += "\n";
				}
			}
		} else {
			answerMessage = 'No macros defined.';
		}

		stateHolder.simpleAddMessage(stateHolder.username, answerMessage);
		return next();
	});
};

ret.set = function(isAdmin, pieces, stateHolder, next) {
	if (pieces.length < 2) {
		stateHolder.simpleAddMessage(stateHolder.channelID, 'Invalid syntax.');
		return next();
	}

	var macroName = pieces[0];
	if (macroName[0] != '!') {
		macroName = '!' + macroName;
	}

	var model = isAdmin ? ret.adminMacroModel : ret.macroModel;
	var params = {
		name: macroName
	};
	if (isAdmin) params.server = stateHolder.serverID;
	if (!isAdmin) params.user = stateHolder.username;

	model.find(params).exec(function(err, res) {
		if (err) {
			stateHolder.simpleAddMessage(stateHolder.username, err);
			return next();
		}

		if (res.length) {
			for (var i = 0; i < res.length; i++) {
				var result = res[i];
				result.remove();
			}
		}

		var macroBody = '';
		for (var i = 1; i < pieces.length; i++) {
			macroBody += pieces[i] + ' ';
		}
		if (macroBody[0] != '!') {
			macroBody = '!' + macroBody;
		}

		params.macro = macroBody;

		var newMacro = new model(params);
		newMacro.save(function(err) {
			if (err) {
				stateHolder.simpleAddMessage(stateHolder.username, 'Error saving macro: ' + err);
				return next();
			} else {
				stateHolder.simpleAddMessage(stateHolder.username, 'Saved macro `' + macroName + '`');
				return next();
			}
		});
	});
};

ret.del = function(isAdmin, pieces, stateHolder, next) {
	var model = isAdmin ? ret.adminMacroModel : ret.macroModel;
	var params = {};
	if (isAdmin) params.server = stateHolder.serverID;
	if (!isAdmin) params.user = stateHolder.username;

	var macroName = pieces[0];
	if (macroName[0] != '!') {
		macroName = '!' + macroName;
	}

	params.name = macroName;

	model.find(params).exec(function(err, res) {
		if (err) {
			stateHolder.simpleAddMessage(stateHolder.username, err);
			return next();
		}

		if (res.length) {
			for (var i = 0; i < res.length; i++) {
				var result = res[i];
				result.remove();
			}
			stateHolder.simpleAddMessage(stateHolder.username, 'Removed macro ' + result.name);
			return next();
		} else {
			stateHolder.simpleAddMessage(stateHolder.username, 'Could not find the macro to remove.');
			return next();
		}
	});	
};

ret.handle = function(pieces, stateHolder, next) {
	var isAdmin = false;
	var action = pieces[1];
	var name = pieces[2];
	var index = 2;
	if (pieces[1] == 'admin') {
		isAdmin = true;
		action = pieces[2];
		name = pieces[3];
		index = 3;
	}

	var massagedPieces = [];
	for (var i = index; i < pieces.length; i++) {
		massagedPieces.push(pieces[i]);
	}

	if (isAdmin) {
		var serverID = stateHolder.findServerID(stateHolder.channelID);
		if (!serverID) {
			stateHolder.simpleAddMessage(stateHolder.username, 'You must use this command from a channel so that I know what server to use.');
			return next();
		}

		var admin = stateHolder.isAdmin(serverID, stateHolder.username);
		if (!admin) {
			stateHolder.simpleAddMessage(stateHolder.username, 'Only administrators can use this command.');
			return next();
		}
	}

	var availableActions = ['get', 'set', 'delete'];
	if (availableActions.indexOf(action) == -1) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Do not recognize that action (' + action + ').');
		return next();		
	}

	switch (action) {
		case 'get':
			ret.get(isAdmin, massagedPieces, stateHolder, next);
			break;
		case 'set':
			ret.set(isAdmin, massagedPieces, stateHolder, next);
			break;
		case 'delete':
			ret.del(isAdmin, massagedPieces, stateHolder, next);
			break;
	}
};

ret.attempted = function(pieces, stateHolder, next) {
	stateHolder.originalArgs = pieces;
	
	ret.adminMacroModel.find({
		name: pieces[0],
		server: stateHolder.serverID
	}).exec(function(err, res) {
		if (err) {
			stateHolder.simpleAddMessage(stateHolder.username, err);
			if (next)
				return next();			
		}

		if (res.length) {
			command = res[0].macro;

			var commands = [];

			var splitMessages = command.split("\n");
			var currentMessage = splitMessages[0];
			for (var i = 1; i < splitMessages.length; i++) {
				if (splitMessages[i][0] != '!') {
					currentMessage += "\n" + splitMessages[i]
				} else {
					commands.push(currentMessage);
					currentMessage = splitMessages[i];
				}
			}
			commands.push(currentMessage);
			stateHolder.block.insertStatements(commands);
			return next();
		} else {
			var parameters = {
				name: pieces[0],
				user: stateHolder.username
			};
			ret.macroModel.find(parameters).exec(function(err, res) {
				if (err) {
					stateHolder.simpleAddMessage(stateHolder.username, err);
					if (next)
						return next();			
				}

				if (res.length) {
					var commands = [];
					command = res[0].macro;
					var splitMessages = command.split("\n");
					var currentMessage = splitMessages[0];
					for (var i = 1; i < splitMessages.length; i++) {
						if (splitMessages[i][0] != '!') {
							currentMessage += "\n" + splitMessages[i]
						} else {
							commands.push(currentMessage);
							currentMessage = splitMessages[i];
						}
					}
					commands.push(currentMessage);

					for (var i = 0; i < commands.length; i++) {
						commands[i] = commands[i].replace(/\[(\d+)\]/g, function(match, p1, offset, string) {
							return pieces[p1];
						});
					}

					stateHolder.block.insertStatements(commands);
					return next();
				} else {
					return next();
				}
			});
		}
	});
};

module.exports = ret;