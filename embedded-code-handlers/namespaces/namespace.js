var async = require('async');

function Namespace(stateHolder) {
	this.type = 'namespace';

	this.stateHolder   = stateHolder;
	this.scalarModel   = stateHolder.mongoose.model('Var');
	this.tableModel    = stateHolder.mongoose.model('Table');
	this.tableRowModel = stateHolder.mongoose.model('TableRow');
}

Namespace.prototype.canEdit = function(cb) {
	return cb(null, true);
};

Namespace.prototype.setScalarValue = function(key, value, cb) {
	var m = this;

	this.canEdit(function(err, canEdit) {
		if (err) return cb(err);
		if (!canEdit) return cb('Cannot edit');

		m.parameters.name = key;
		m.scalarModel.find(m.parameters).exec(function(err, res) {
			if (err) return cb(err);

			async.eachSeries(
				res,
				function(index, next) {
					index.remove(next);
				},
				function(err) {
					if (err) return cb(err);

					m.parameters.value = value;

					var scalar = new m.scalarModel(m.parameters);
					return scalar.save(cb);
				}
			)
		});
	});
};

Namespace.prototype.setTableValue = function(tableName, key, value, cb) {
	var m = this;

	this.canEdit(function(err, canEdit) {
		if (err) return cb(err);
		if (!canEdit) return cb('Cannot edit');

		m.parameters.name = tableName;

		console.log('setTableValue parameters', m.parameters);

		m.tableModel.find(m.parameters).exec(function(err, res) {
			if (err) return cb(err);

			if (res.length == 0) {
				return cb('No such table: ' + tableName);
			}

			var table = res[0].id;

			var parameters = {
				table: table,
				key: key
			};

			m.tableRowModel.find(parameters).exec(function(err, res) {
				if (err) return cb(err);

				async.eachSeries(
					res,
					function(index, next) {
						index.remove(next);
					},
					function(err) {
						if (err) return cb(err);
						var parameters = {
							table: table,
							key: key,
							value: value
						};
						console.log('creating table row', parameters);
						var tableRow = new m.tableRowModel(parameters);
						return tableRow.save(cb);
					}
				);
			});
		});
	});
};

Namespace.prototype.getTableValueByKey = function(key, cb) {
	this.parameters.name = key;

	this.model.find(this.parameters).exec(function(err, res) {
		console.log(err, res);

		if (err) {
			return cb(err);
		}

		if (res.length == 0) {
			return cb(null, '');
		}

		return cb(null, res[0].value);
	});
};

module.exports = Namespace;