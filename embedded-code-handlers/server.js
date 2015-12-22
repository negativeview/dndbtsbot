function newServer(stateHolder, varModel) {
	var ret = {
		stateHolder: stateHolder,
		varModel: varModel,
		putSub: function(key, value, next) {
			var serverID = stateHolder.findServerID(stateHolder.channelID);
			if (!serverID) {
				console.log('no server id');
				return next('');
			}

			var admin = stateHolder.isAdmin(serverID, stateHolder.username);
			if (!admin) {
				console.log('not admin');
				return next('');
			}

			var parameters = {};
			parameters.name = key;
			parameters.server = stateHolder.bot.serverFromChannel(stateHolder.channelID);

			ret.varModel.find(parameters).exec(function(err, res) {
				if (err) {
					console.log(err);
					return next('');
				}

				for (var i = 0; i < res.length; i++) {
					res[i].remove();
				}

				parameters.value = value;
				var newVar = new ret.varModel(parameters);
				newVar.save(function(err) {
					return next('');
				});
			});
		},
		getSub: function(key, next) {
			var parameters = {};
			parameters.name = key;
			parameters.server = stateHolder.bot.serverFromChannel(stateHolder.channelID);

			ret.varModel.find(parameters).exec(
				function(err, res) {
					if (err) {
						console.log(err);
						next('');
					}

					if (res.length) {
						return next(res[0].value);
					} else {
						return next('');
					}
				}
			);
		}
	};
	return ret;
}

module.exports = newServer;