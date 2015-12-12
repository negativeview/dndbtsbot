var ret = {
	varModel: null
};

ret.init = function(mongoose) {
	var Schema = mongoose.Schema;
	var VarSchema = new Schema({
		name: String,
		user: String,
		channel: String,
		value: String
	});
	mongoose.model('Var', VarSchema);

	ret.varModel = mongoose.model('Var');
};

/**
 * TODO: `var get me` to list all variables.
 **/
function varGet(pieces, stateHolder, next) {
	if (pieces.length < 4) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Not enough parameters to var get.');
		return next();
	}

	var parameters = {};

	var namespace = pieces[2];
	var index = 4;
	if (namespace == 'me') {
		if (stateHolder.contextUser) {
			parameters.user = stateHolder.contextUser;
		} else {
			parameters.user = stateHolder.username;
		}
		parameters.name = pieces[3];
	} else if (namespace == 'channel') {
		parameters.channel = stateHolder.channelID;
		parameters.name = pieces[3];
	} else if (namespace == 'user') {
		var serverID = stateHolder.findServerID(stateHolder.channelID);
		parameters.user = stateHolder.memberNameToNumber(stateHolder.serverID, pieces[3]);
		parameters.name = pieces[4];
		index = 5;
	}

	var value = '';
	for (var i = index; i < pieces.length; i++) {
		if (i != index) value += ' ';
		value += pieces[i];
	}

	ret.varModel.find(parameters).exec(
		function(err, res) {
			if (err) {
				console.log(err);
				next();
			}

			if (res.length) {
				stateHolder.simpleAddMessage(stateHolder.channelID, res[0].value);
			} else {
				stateHolder.simpleAddMessage(stateHolder.username, 'No such variable.');
			}
			next();
		}
	);
}

function varSet(pieces, stateHolder, next) {
	if (pieces.length < 5) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Not enough parameters to var set.');
		return next();
	}

	var parameters = {};

	var namespace = pieces[2];
	var index = 4;
	if (namespace == 'me') {
		parameters.user = stateHolder.username;
		parameters.name = pieces[3];
	} else if (namespace == 'channel') {
		parameters.channel = stateHolder.channelID;
		parameters.name = pieces[3];
	} else if (namespace == 'user') {
		var serverID = stateHolder.findServerID(stateHolder.channelID);
		parameters.user = stateHolder.memberNameToNumber(stateHolder.serverID, pieces[3]);
		parameters.name = pieces[4];
		index = 5;
	}

	if (parameters.name[0] == '_') {
		stateHolder.simpleAddMessage(stateHolder.username, '**Note** that variables that start with a _ will likely have a special meaning in the future. If you are using this variable for an unofficial reason, be warned.');
	}

	var value = '';
	for (var i = index; i < pieces.length; i++) {
		if (i != index) value += ' ';
		value += pieces[i];
	}

	ret.varModel.find(parameters).exec(
		function(err, res) {
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
		}
	);
}

ret.handle = function(pieces, stateHolder, next) {
	var allowedOperators = ['set', 'get', 'inc', 'del', 'dec'];
	var allowedNamespaces = ['me', 'channel', 'user'];

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
			var admin = stateHolder.isAdmin(serverID, stateHolder.username);
			if (!admin) {
				stateHolder.simpleAddMessage(stateHolder.username, 'Only administrators can use this command.');
				return next();
			}
		}
	}

	if (pieces[2] == 'user') {
		if (pieces[1] == 'set') {
			var admin = stateHolder.isAdmin(serverID, stateHolder.username);
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
			varDel(pieces);
			break;
	}
};

module.exports = ret;