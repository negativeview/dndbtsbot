var async = require('async');

var ret = {
	roomRoleModel: null
};

ret.init = function(mongoose) {
	console.log('here?');
	var Schema = mongoose.Schema;
	var RoomRoleSchema = new Schema({
		roleName: String,
		user: String,
		channel: String
	});
	mongoose.model('RoomRole', RoomRoleSchema);

	ret.roomRoleModel = mongoose.model('RoomRole');
};

ret.eachPlayer = function(pieces, message, rawEvent, channelID, globalHandler, stateHolder, next) {
	var parameters = {
		channel: channelID
	};

	ret.roomRoleModel.find(parameters).exec(function(err, res) {
		if (err) {
			console.log(err);
			return next();
		}

		var commandToRun = stateHolder.getMessage(channelID);
		stateHolder.overrideEvaluationMessage = commandToRun;
		stateHolder.clearMessages(channelID);
		async.eachSeries(
			res,
			function(item, callback) {
				if (item.roleName == 'player') {
					stateHolder.contextUser = item.user;
					console.log(stateHolder.contextUser);
					globalHandler('', '', channelID, commandToRun, rawEvent, stateHolder, callback);
				} else {
					console.log(item);
				}
			},
			function() {
				return next();
			}
		);
	});	
};

ret.viewRoles = function(pieces, message, rawEvent, channelID, globalHandler, stateHolder, next) {
	var username = rawEvent.d.author.id;

	var parameters = {
		channel: channelID
	};

	ret.roomRoleModel.find(parameters).exec(function(err, res) {
		if (err) {
			console.log(err);
			return next();
		}

		var message = '';
		for (var i = 0; i < res.length; i++) {
			if (message != '') {
				message += "\n";
			}

			message += stateHolder.memberNumberToName(stateHolder.findServerID(channelID), res[i].user) + ': ' + res[i].roleName;
		}

		stateHolder.simpleAddMessage(username, message);
		return next();
	});
};

ret.setRole = function(pieces, message, rawEvent, channelID, globalHandler, stateHolder, next) {
	var username = rawEvent.d.author.id;

	if (pieces.length < 2) {
		stateHolder.simpleAddMessage(username, 'Invalid syntax.');
		return next();
	}

	var knownRoles = ['dm', 'player'];

	if (knownRoles.indexOf(pieces[1]) == -1) {
		stateHolder.simpleAddMessage(username, 'Warning: I have no idea what that role means.');
	}

	var parameters = {
		channel: channelID,
		user: username
	};

	ret.roomRoleModel.find(parameters).exec(function(err, res) {
		if (err) {
			console.log(err);
			return next();
		}

		for (var i = 0; i < res.length; i++) {
			res[i].remove();
		}

		parameters.roleName = pieces[1];

		var newRole = new ret.roomRoleModel(parameters);
		newRole.save(function(err) {
			if (err) {
				console.log(err);
				return next();
			}

			stateHolder.simpleAddMessage(username, 'Set your role.');
			return next();
		});
	});
};

module.exports = ret;