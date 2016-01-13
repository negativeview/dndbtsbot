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

Namespace.prototype.getTableRow = function(tableName, key, cb) {
	var m = this;

	this.canEdit(function(err, canEdit) {
		if (err) return cb(err);
		if (!canEdit) return cb('Cannot edit');

		m.parameters.name = tableName;

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

				return cb(null, res);
			});
		});
	});
};

Namespace.prototype.setTableValue = function(tableName, key, value, cb) {
	this.getTableRow(tableName, key, function(error, res) {
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
				var tableRow = new m.tableRowModel(parameters);
				return tableRow.save(cb);
			}
		);
	});
};

Namespace.prototype.getTableValueByKey = function(tableName, key, cb) {
	console.log('getTableValueByKey');
	this.getTableRow(tableName, key, function(error, res) {
		console.log('returned', error, res);
		if (error) return cb(error);
		if (res.length == 0) return cb(null, '');
		console.log('here:', res);
		return cb(null, res[0].value);
	});
};

module.exports = Namespace;