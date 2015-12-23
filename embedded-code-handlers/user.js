function newUser(stateHolder, varModel, tableModel, tableRowModel) {
	var ret = {
		stateHolder: stateHolder,
		varModel: varModel,
		tableModel: tableModel,
		tableRowModel: tableRowModel,
		getTable: function(name, next) {
			var parameters = {
				user: stateHolder.username,
				name: name
			};
			ret.tableModel.find(parameters).exec(
				function(err, res) {
					if (err) {
						console.log(err);
						return next();
					}

					if (res.length == 0) {
						return next([]);
					}

					var table = res[0];
					parameters = {
						table: table._id,
					};

					ret.tableRowModel.find(parameters).exec(
						function(err2, res2) {
							if (err2) {
								console.log(err2);
								return next();
							}

							if (res2.length == 0) {
								return next([]);
							}

							var tmp = [];
							for (var i = 0; i < res2.length; i++) {
								tmp.push(res2[i]);
							}
							return next(tmp);
						}
					);
				}
			);
		},
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