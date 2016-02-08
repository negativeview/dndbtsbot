var async = require('async');

function Namespace(stateHolder) {
	this.type = 'NAMESPACE';

	this.stateHolder   = stateHolder;
	this.scalarModel   = stateHolder.mongoose.model('Var');
	this.tableModel    = stateHolder.mongoose.model('Table');
	this.tableRowModel = stateHolder.mongoose.model('TableRow');
}

Namespace.prototype.canEdit = function(cb) {
	return cb(null, true);
};

Namespace.prototype.getTable = function(tableName, cb) {
	this.parameters.name = tableName;
	this.tableModel.find(this.parameters).exec(
		(err, res) => {
			if (err) return cb(err);
			if (res.length == 0) return cb('No such table: ' + tableName);

			var id = res[0].id;

			var parameters = {
				table: id
			};

			this.tableRowModel.find(parameters).exec(
				(err, res) => {
					if (err) return cb(err);

					return cb(null, res);
				}
			);
		}
	);
};

Namespace.prototype.getScalarValue = function(key, cb) {
	this.parameters.name = key;
	this.scalarModel.find(this.parameters).exec(
		(err, res) => {
			if (err) return cb(err);
			if (res.length == 0) return cb('');
			return cb(null, res[0].value);
		}
	);
}

Namespace.prototype.setScalarValue = function(key, value, cb) {
	this.canEdit(
		(err, canEdit) => {
			if (err) return cb(err);
			if (!canEdit) return cb('Cannot edit');

			this.parameters.name = key;
			this.scalarModel.find(this.parameters).exec(
				(err, res) => {
					if (err) return cb(err);

					async.eachSeries(
						res,
						(index, next) => {
							index.remove(next);
						},
						(err) => {
							if (err) return cb(err);

							this.parameters.value = value;

							var scalar = new this.scalarModel(this.parameters);
							return scalar.save(cb);
						}
					)
				}
			);
		}
	);
};

Namespace.prototype.getTableRow = function(tableName, key, cb) {
	this.canEdit(
		(err, canEdit) => {
			if (err) return cb(err);
			if (!canEdit) return cb('Cannot edit');

			this.parameters.name = tableName;

			this.tableModel.find(this.parameters).exec(
				(err, res) => {
					if (err) return cb(err);

					if (res.length == 0) {
						return cb('No such table: ' + tableName);
					}

					var table = res[0].id;

					var parameters = {
						table: table,
						key: key
					};

					this.tableRowModel.find(parameters).exec(
						(err, res) => {
							if (err) return cb(err);

							return cb(null, table, res);
						}
					);
				}
			);
		}
	);
};

Namespace.prototype.setTableValue = function(tableName, key, value, cb) {
	this.getTableRow(
		tableName,
		key,
		(error, table, res) => {
			if (error) return cb(error);

			async.eachSeries(
				res,
				(index, next) => {
					index.remove(next);
				},
				(err) => {
					if (err) return cb(err);
					var parameters = {
						table: table,
						key: key,
						value: value
					};
					var tableRow = new this.tableRowModel(parameters);
					return tableRow.save(cb);
				}
			);
		}
	);
};

Namespace.prototype.getTableValueByKey = function(tableName, key, cb) {
	this.getTableRow(
		tableName,
		key,
		(error, table, res) => {
			if (error) return cb(error);
			if (res.length == 0) return cb(null, '');
			return cb(null, res[0].value);
		}
	);
};

module.exports = Namespace;