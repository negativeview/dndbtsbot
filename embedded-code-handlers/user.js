function newUser(stateHolder, varModel) {
	var ret = {
		stateHolder: stateHolder,
		varModel: varModel,
		getSub: function(key, next) {
			var parameters = {};
			parameters.name = key;
			parameters.user = stateHolder.username;

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
		},
		putSub: function(key, value, next) {
			var parameters = {};
			parameters.name = key;
			parameters.user = stateHolder.username;

			ret.varModel.find(parameters).exec(
				function(err, res) {
					if (err) {
						console.log(err);
						next('');
					}

					for (var i = 0; i < res.length; i++) {
						res[i].remove();
					}

					parameters.value = value;
					var newVar = new ret.varModel(parameters);
					newVar.save(function(err) {
						return next('');
					});
				}
			);
		}
	};
	return ret;
}

module.exports = newUser;