function newCharacter(stateHolder, characterModel) {
	var ret = {
		stateHolder: stateHolder,
		characterModel: characterModel,
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
						console.log('No such user.');
						return next('');
					}

					var character = res[0];

					character[key] = value;
					character.save(function(err) {
						if (err) {
							console.log(err);
						}

						return next('');
					});
				}
			);
		}

	};
	return ret;
}

module.exports = newCharacter;