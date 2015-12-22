function newServer(stateHolder, varModel) {
	var ret = {
		stateHolder: stateHolder,
		varModel: varModel,
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