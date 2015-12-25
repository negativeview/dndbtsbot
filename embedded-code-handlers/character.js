function newCharacter(stateHolder, characterModel, tableModel, tableRowModel, varModel) {
	var ret = {
		stateHolder: stateHolder,
		characterModel: characterModel,
		tableModel: tableModel,
		tableRowModel: tableRowModel,
		varModel: varModel,
		getSub: function(key, next) {
			var parameters = {
				user: ret.stateHolder.username,
				isCurrent: true
			};
			ret.characterModel.find(parameters).exec(
				function(err, res) {
					if (err) {
						console.log(err);
						return next('');
					}

					if (res.length) {
						var character = res[0];
						if (character[key]) return next(character[key]);

						var parameters = {};
						parameters.character = character._id;
						parameters.name = key;

						ret.varModel.find(parameters).exec(
							function(err, res) {
								if (err) {
									console.log(err);
									return next('');
								}

								if (res.length) {
									var res = res[0];
									return next(res.value);
								}
							}
						);
						return;
					}

					return next('');
				}
			);
		},
		putSub: function(key, value, next) {
			var parameters = {
				user: ret.stateHolder.username,
				isCurrent: true
			};
			ret.characterModel.find(parameters).exec(
				function(err, res) {
					if (err) {
						console.log(err);
						return next('');
					}

					if (res.length == 0) {
						console.log('No such character.');
						return next('');
					}

					var character = res[0];

					if (character[key]) {
						character[key] = value;
						character.save(function(err) {
							if (err) {
								console.log(err);
							}

							return next('');
						});
						return;
					}

					var parameters = {};
					parameters.character = character._id;
					parameters.name = key;

					ret.varModel.find(parameters).exec(
						function(err, res) {
							if (err) {
								console.log(err);
								return next('');
							}

							for (var i = 0; i < res.length; i++) {
								res[i].remove();
							}

							var parameters = {
								character: character._id,
								name: key,
								value: value
							};

							var newVar = new ret.varModel(parameters);
							newVar.save(function(err, product) {
								if (err) {
									console.log(err);
									return next('');
								}

								return next('');
							});
						}
					);
				}
			);
		}

	};
	return ret;
}

module.exports = newCharacter;