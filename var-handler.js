var ret = {
	varModel: null
};

ret.init = function(mongoose) {
	ret.varModel = mongoose.model('Var');
};

function varGetAll(pieces, stateHolder, next) {
	var parameters = {};

	var namespace = pieces[2];
	setupVarParameters(parameters, namespace, stateHolder, function(err) {
		ret.varModel.find(parameters).exec(function(err, res) {
			if (err) {
				console.log(err);
				next();
			}

			for (var i = 0; i < res.length; i++) {
				if (i != 0)
					stateHolder.simpleAddMessage(stateHolder.username, "\n");
				stateHolder.simpleAddMessage(stateHolder.username, res[i].name + ': ' + res[i].value);
			}

			return next();
		});
	});
}

/**
 * TODO: `var get me` to list all variables.
 **/
function varGet(pieces, stateHolder, next) {
	pieces = pieces.filter(function(element, index, array) {
		if (element) return true;
		return false;
	});

	if (pieces.length == 3) {
		return varGetAll(pieces, stateHolder, next);
	}

	if (pieces.length < 4) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Not enough parameters to var get.');
		return next();
	}

	var parameters = {};
	parameters.name = pieces[3];

	var namespace = pieces[2];

	var value = '';
	for (var i = 4; i < pieces.length; i++) {
		if (i != 4) value += ' ';
		value += pieces[i];
	}

	setupVarParameters(parameters, namespace, stateHolder, function(err) {
		if (err) {
			console.log(err);
			stateHolder.simpleAddMessage(stateHolder.username, err);
			return next();
		}

		ret.varModel.find(parameters).exec(function(err, res) {
			if (err) {
				console.log(err);
				next();
			}

			if (res.length) {
				stateHolder.simpleAddMessage(stateHolder.channelID, res[0].value);
			} else {
				stateHolder.simpleAddMessage(stateHolder.username, 'No such variable ' + parameters.name + '.');
			}
			next();
		});
	});
}

function varDel(pieces, stateHolder, next) {
	if (pieces.length < 4) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Not enough parameters to var set.');
		return next();
	}

	var parameters = {};
	parameters.name = pieces[3];

	var namespace = pieces[2];

	setupVarParameters(parameters, namespace, stateHolder, function(err) {
		if (err) {
			console.log(err);
			stateHolder.simpleAddMessage(stateHolder.username, err);
			return next();
		}

		ret.varModel.find(parameters).exec(function(err, res) {
			if (err) {
				console.log(err);
				return next();
			}

			for (var i = 0; i < res.length; i++) {
				res[i].remove();
			}
		});
	});
}

function setupVarParameters(parameters, namespace, stateHolder, next) {
	if (namespace == 'me') {
		parameters.user = stateHolder.username;
		return next();
	} else if (namespace == 'channel') {
		parameters.channel = stateHolder.channelID;
		return next();
	} else if (namespace == 'character') {
		var characterModel = stateHolder.mongoose.model('Character');
		var p2 = {
			user: stateHolder.username,
			isCurrent: true
		};
		characterModel.find(p2).exec(function(err, res) {
			if (err) return next(err);

			if (res.length == 0) {
				return next('No current character.');
			}

			parameters.character = res[0].id;
			return next();
		});
	}
}

function varSet(pieces, stateHolder, next) {
	if (pieces.length < 5) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Not enough parameters to var set.');
		return next();
	}

	var parameters = {};
	var namespace = pieces[2];
	var value = '';
	for (var i = 4; i < pieces.length; i++) {
		if (i != 4) value += ' ';
		value += pieces[i];
	}
	parameters.name = pieces[3];

	setupVarParameters(parameters, namespace, stateHolder, function(err) {
		if (err) {
			console.log(err);
			stateHolder.simpleAddMessage(stateHolder.username, err);
			return next();
		}

		ret.varModel.find(parameters).exec(function(err, res) {
			if (err) {
				console.log(err);
				return next();
			}

			for (var i = 0; i < res.length; i++) {
				res[i].remove();
			}

			parameters.value = value;

			var newVar = new ret.varModel(parameters);
			newVar.save(function(err) {
				if (err) {
					console.log(err);
					return next();
				}

				stateHolder.simpleAddMessage(stateHolder.username, 'Saved var ' + parameters.name);
				next();
			});
		});
	});
}

ret.handle = function(pieces, stateHolder, next) {
	var allowedOperators = ['set', 'get', 'inc', 'del', 'dec'];
	var allowedNamespaces = ['me', 'channel', 'character'];

	if (allowedOperators.indexOf(pieces[1]) == -1) {
		stateHolder.simpleAddMessage(stateHolder.username, pieces[1] + ' is not a valid var operator.');
		return next();
	}

	if (allowedNamespaces.indexOf(pieces[2]) == -1) {
		stateHolder.simpleAddMessage(stateHolder.username, pieces[2] + ' is not a valid variable scope.');
		return next();
	}

	var serverID = stateHolder.findServerID(stateHolder.channelID);
	if (pieces[2] == 'channel') {
		if (!serverID) {
			stateHolder.simpleAddMessage(stateHolder.username, 'You must use this command from a channel so that I know what server to use.');
			return next();
		}

		if (pieces[1] != 'get') {
			var admin = stateHolder.isAdmin(stateHolder.username);
			if (!admin) {
				stateHolder.simpleAddMessage(stateHolder.username, 'Only administrators can use this command.');
				return next();
			}
		}
	}

	if (pieces[2] == 'user') {
		if (pieces[1] == 'set') {
			var admin = stateHolder.isAdmin(stateHolder.username);
			if (!admin) {
				stateHolder.simpleAddMessage(stateHolder.username, 'Only administrators can use this command.');
				return next();
			}			
		}
	}

	switch (pieces[1]) {
		case 'set':
			varSet(pieces, stateHolder, next);
			break;
		case 'get':
			varGet(pieces, stateHolder, next);
			break;
		case 'inc':
			varInc(pieces);
			break;
		case 'dec':
			varDec(pieces);
			break;
		case 'del':
			varDel(pieces, stateHolder, next);
			break;
	}
};

module.exports = ret;