var ret = {};

ret.init = function(mongoose) {
	var Schema = mongoose.Schema;

	var TableSchema = new Schema({
		name: String,
		user: String,
		channel: String,
		server: String,
		publicEdit: Boolean
	});
	mongoose.model('Table', TableSchema);

	ret.tableModel = mongoose.model('Table');

	var TableRowSchema = new Schema({
		table: String,
		key: String,
		value: String
	});
	mongoose.model('TableRow', TableRowSchema);
	ret.tableRowModel = mongoose.model('TableRow');
};

function wrapGetTable(parameters, stateHolder, errNext, goodNext) {
	ret.tableModel.find(parameters).exec(
		function(err, results) {
			if (err) {
				stateHolder.simpleAddMessage(stateHolder.username, err);
				return errNext();
			}

			if (!results.length) {
				stateHolder.simpleAddMessage(stateHolder.username, 'No table found.');
				return errNext();
			}

			return goodNext(results);
		}
	);
}

ret.getAll = function(pieces, stateHolder, next) {
	var parameters = {};

	if (pieces[2] == 'me') {
		parameters.user = stateHolder.username;
	} else if (pieces[2] == 'channel') {
		parameters.channel = stateHolder.channelID
	} else if (pieces[2] == 'server') {
		parameters.server = stateHolder.bot.serverFromChannel(stateHolder.channelID);
	} else {
		stateHolder.simpleAddMessage(stateHolder.username, 'Invalid namespace: ' + pieces[2]);
		return next();
	}

	wrapGetTable(parameters, stateHolder, next, function(results) {
		for (var i = 0; i < results.length; i++) {
			if (i != 0) {
				stateHolder.simpleAddMessage(stateHolder.username, "\n");
			}
			stateHolder.simpleAddMessage(stateHolder.username, results[i].name);
		}
		return next();
	});
};

ret.getKeys = function(pieces, stateHolder, next) {
	var name = pieces[3];

	var parameters = {
		name: name,
	};

	if (pieces[2] == 'me') {
		parameters.user = stateHolder.username;
	} else if (pieces[2] == 'channel') {
		parameters.channel = stateHolder.channelID
	} else if (pieces[2] == 'server') {
		parameters.server = stateHolder.bot.serverFromChannel(stateHolder.channelID);
	} else {
		stateHolder.simpleAddMessage(stateHolder.username, 'Invalid namespace: ' + pieces[2]);
		return next();
	}

	wrapGetTable(parameters, stateHolder, next, function(results) {
		var table = results[0];

		var rowParameters = {
			table: table._id
		};

		ret.tableRowModel.find(rowParameters).exec(
			function(err, results) {
				if (err) {
					stateHolder.simpleAddMessage(stateHolder.username, err);
					return next();
				}

				for (var i = 0; i < results.length; i++) {
					if (i != 0) {
						stateHolder.simpleAddMessage(stateHolder.username, "\n");
					}
					stateHolder.simpleAddMessage(stateHolder.username, name + '.' + results[i].key + ': ' + results[i].value);
				}
				return next();
			}
		);
	});
};

ret.getRand = function(pieces, stateHolder, next) {
	var name = pieces[3];

	var parameters = {
		name: name,
	};

	if (pieces[2] == 'me') {
		parameters.user = stateHolder.username;
	} else if (pieces[2] == 'channel') {
		parameters.channel = stateHolder.channelID
	} else if (pieces[2] == 'server') {
		parameters.server = stateHolder.bot.serverFromChannel(stateHolder.channelID);
	} else {
		stateHolder.simpleAddMessage(stateHolder.username, 'Invalid namespace: ' + pieces[2]);
		return next();
	}

	wrapGetTable(parameters, stateHolder, next, function(results) {
		var table = results[0];

		var rowParameters = {
			table: table._id,
		};

		ret.tableRowModel.find(rowParameters).exec(
			function(err, results) {
				if (err) {
					stateHolder.simpleAddMessage(stateHolder.username, err);
					return next();						
				}

				var min = 0;
				var max = results.length - 1;
				var index = Math.floor(Math.random() * (max - min + 1)) + min;

				var result = results[index];

				stateHolder.simpleAddMessage(stateHolder.channelID, result.value);
				return next();
			}
		);
	});
};

ret.get = function(pieces, stateHolder, next) {
	var name = pieces[3];
	var key = pieces[4];

	var parameters = {
		name: name,
	};

	if (pieces[2] == 'me') {
		parameters.user = stateHolder.username;
	} else if (pieces[2] == 'channel') {
		parameters.channel = stateHolder.channelID
	} else if (pieces[2] == 'server') {
		parameters.server = stateHolder.bot.serverFromChannel(stateHolder.channelID);
	} else {
		stateHolder.simpleAddMessage(stateHolder.username, 'Invalid namespace: ' + pieces[2]);
		return next();
	}

	wrapGetTable(parameters, stateHolder, next, function(results) {
		var table = results[0];

		var rowParameters = {
			table: table._id,
			key: key
		};

		ret.tableRowModel.find(rowParameters).exec(
			function(err, results) {
				if (err) {
					stateHolder.simpleAddMessage(stateHolder.username, err);
					return next();						
				}

				if (results.length == 0) {
					stateHolder.simpleAddMessage(stateHolder.username, 'No such key.');
					return next();
				}

				var result = results[0];
				
				stateHolder.simpleAddMessage(stateHolder.channelID, result.value);
				return next();
			}
		);
	});
};

ret.set = function(pieces, stateHolder, next) {
	var name = pieces[3];
	var key = pieces[4];

	var value = '';
	for (var i = 5; i < pieces.length; i++) {
		if (value != '')
			value += ' ';
		value += pieces[i];
	}

	var parameters = {
		name: name,
	};

	if (pieces[2] == 'me') {
		parameters.user = stateHolder.username;
	} else if (pieces[2] == 'channel') {
		parameters.channel = stateHolder.channelID
	} else if (pieces[2] == 'server') {
		parameters.server = stateHolder.bot.serverFromChannel(stateHolder.channelID);
	} else {
		stateHolder.simpleAddMessage(stateHolder.username, 'Invalid namespace: ' + pieces[2]);
		return next();
	}

	wrapGetTable(parameters, stateHolder, next, function(results) {
		var table = results[0];

		if (!(table.publicEdit)) {
			var serverID = stateHolder.findServerID(stateHolder.channelID);
			if (pieces[2] == 'channel') {
				if (!serverID) {
					stateHolder.simpleAddMessage(stateHolder.username, 'You must use this command from a channel so that I know what server to use.');
					return next();
				}

				var admin = stateHolder.isAdmin(serverID, stateHolder.username);
				if (!admin) {
					stateHolder.simpleAddMessage(stateHolder.username, 'You cannot edit this table.');
					return next();
				}
			}
		}

		var rowParameters = {
			table: table._id,
			key: key
		};

		ret.tableRowModel.find(rowParameters).exec(
			function(err, results) {
				if (err) {
					stateHolder.simpleAddMessage(stateHolder.username, err);
					return next();						
				}

				for (var i = 0; i < results.length; i++) {
					results[i].remove();
				}

				rowParameters.value = value;
				var newTableRow = new ret.tableRowModel(rowParameters);
				newTableRow.save(function(err) {
					if (err) {
						stateHolder.simpleAddMessage(stateHolder.username, err);
						return next();
					}

					stateHolder.simpleAddMessage(stateHolder.username, 'Saved.');
					return next();
				});
			}
		);
	});
};

ret.del = function(pieces, stateHolder, next) {
	if (pieces.length == 5) {
		return ret.delKey(pieces, stateHolder, next);
	} else {
		return ret.delTable(pieces, stateHolder, next);
	}
};

ret.delKey = function(pieces, stateHolder, next) {
	var name = pieces[3];
	var key = pieces[4];

	var parameters = {
		name: name,
	};

	if (pieces[2] == 'me') {
		parameters.user = stateHolder.username;
	} else if (pieces[2] == 'channel') {
		parameters.channel = stateHolder.channelID
	} else if (pieces[2] == 'server') {
		parameters.server = stateHolder.bot.serverFromChannel(stateHolder.channelID);
	} else {
		stateHolder.simpleAddMessage(stateHolder.username, 'Invalid namespace: ' + pieces[2]);
		return next();
	}

	wrapGetTable(parameters, stateHolder, next, function(results) {
		var table = results[0];

		var rowParameters = {
			table: table._id,
			key: key
		};

		ret.tableRowModel.find(rowParameters).exec(
			function(err, results) {
				if (err) {
					stateHolder.simpleAddMessage(stateHolder.username, err);
					return next();						
				}

				for (var i = 0; i < results.length; i++) {
					results[i].remove();
				}

				stateHolder.simpleAddMessage(stateHolder.username, 'Deleted.');
				return next();
			}
		);
	});
};

ret.delTable = function(pieces, stateHolder, next) {
	var name = pieces[3];

	var parameters = {
		name: name,
	};

	if (pieces[2] == 'me') {
		parameters.user = stateHolder.username;
	} else if (pieces[2] == 'channel') {
		parameters.channel = stateHolder.channelID
	} else if (pieces[2] == 'server') {
		parameters.server = stateHolder.bot.serverFromChannel(stateHolder.channelID);
	} else {
		stateHolder.simpleAddMessage(stateHolder.username, 'Invalid namespace: ' + pieces[2]);
		return next();
	}

	wrapGetTable(parameters, stateHolder, next, function(results) {
		var table = results[0];

		var rowParameters = {
			table: table._id,
		};

		ret.tableRowModel.find(rowParameters).exec(
			function(err, results) {
				if (err) {
					stateHolder.simpleAddMessage(stateHolder.username, err);
					return next();						
				}

				for (var i = 0; i < results.length; i++) {
					results[i].remove();
				}

				table.remove();

				stateHolder.simpleAddMessage(stateHolder.username, 'Deleted.');
				return next();
			}
		);
	});
};

ret.create = function(pieces, stateHolder, next) {
	var name = pieces[3];

	var parameters = {
		name: name,
		publicEdit: false
	};

	for (var i = 4; i < pieces.length; i++) {
		parameters[pieces[i]] = true;
	}

	if (pieces[2] == 'me') {
		parameters.user = stateHolder.username;
	} else if (pieces[2] == 'channel') {
		parameters.channel = stateHolder.channelID
	} else if (pieces[2] == 'server') {
		parameters.server = stateHolder.bot.serverFromChannel(stateHolder.channelID);
	} else {
		stateHolder.simpleAddMessage(stateHolder.username, 'Invalid namespace: ' + pieces[2]);
		return next();
	}

	ret.tableModel.find(parameters).exec(
		function(err, results) {
			if (err) {
				stateHolder.simpleAddMessage(stateHolder.username, err);
				return next();
			}

			for (var i = 0; i < results.length; i++) {
				results[i].remove();
			}

			var newTable = new ret.tableModel(parameters);
			newTable.save(function(err) {
				if (err) {
					stateHolder.simpleAddMessage(stateHolder.username, err);
					return next();
				}

				stateHolder.simpleAddMessage(stateHolder.username, 'Created table ' + parameters.name);
				return next();
			});
		}
	);
}

ret.handle = function(pieces, stateHolder, next) {
	console.log(pieces);
	
	if (pieces.length < 2) {
		stateHolder.simpleAddMessage(stateHolder.username, 'What should I do with tables?');
		return next();
	}

	var serverID = stateHolder.findServerID(stateHolder.channelID);
	if (pieces[2] == 'channel' || pieces[2] == 'server') {
		if (!serverID) {
			stateHolder.simpleAddMessage(stateHolder.username, 'You must use this command from a channel so that I know what server/channel to use.');
			return next();
		}

		if (pieces[1] != 'get' && pieces[1] != 'set') {
			var admin = stateHolder.isAdmin(serverID, stateHolder.username);
			if (!admin) {
				stateHolder.simpleAddMessage(stateHolder.username, 'Only administrators can use this command.');
				return next();
			}
		}
	}

	switch (pieces[1]) {
		case 'delete':
			if (pieces.length != 4 && pieces.length != 5) {
				stateHolder.simpleAddMessage(stateHolder.username, 'Wrong number of arguments to delete a table.');
				return next();				
			}
			return ret.del(pieces, stateHolder, next);
		case 'create':
			if (pieces.length != 4 && pieces.length != 5) {
				stateHolder.simpleAddMessage(stateHolder.username, 'Wrong number of arguments to create a table.');
				return next();
			}
			return ret.create(pieces, stateHolder, next);
		case 'set':
			if (pieces.length < 6) {
				stateHolder.simpleAddMessage(stateHolder.username, 'Wrong number of arguments to set a table value.');
				return next();
			}
			return ret.set(pieces, stateHolder, next);
		case 'random':
			if (pieces.length != 4) {
				stateHolder.simpleAddMessage(stateHolder.username, 'Wrong number of arguments to get a random table value.');
				return next();
			}
			return ret.getRand(pieces, stateHolder, next);
		case 'get':
			if (pieces.length == 3) {
				return ret.getAll(pieces, stateHolder, next);
			}
			if (pieces.length == 4) {
				return ret.getKeys(pieces, stateHolder, next);
			}
			if (pieces.length != 5) {
				stateHolder.simpleAddMessage(stateHolder.username, 'Wrong number of arguments to get a table value.');
				return next();
			}
			return ret.get(pieces, stateHolder, next);
	}

	stateHolder.simpleAddMessage(stateHolder.username, 'Invalid action: ' + pieces[1]);
	return next();
};

module.exports = ret;