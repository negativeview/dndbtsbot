var util = require('util');
var Namespace = require('./namespace.js');

function CharacterNamespace(stateHolder) {
	Namespace.call(this, stateHolder);
}
util.inherits(CharacterNamespace, Namespace);

CharacterNamespace.prototype.getTable = function(tableName, cb) {
	throw new Error('here');
};

CharacterNamespace.prototype.getActiveCharacter = function(cb) {
	if (this.activeCharacter) return cb();

	var characterModel = this.stateHolder.mongoose.model('Character');

	var parameters = {
		user: this.stateHolder.username,
		isCurrent: true
	};

	characterModel.find(parameters).exec(
		(err, res) => {
			if (err) return cb(err);
			if (res.length == 0) return cb('No active character.');

			this.activeCharacter = res[0];
			return cb();
		}
	);
}

CharacterNamespace.prototype.getScalarValue = function(key, cb) {
	this.getActiveCharacter(
		(err) => {
			if (err) return cb(err);

			if (key in this.activeCharacter) {
				return cb(this.activeCharacter[key]);
			}
		}
	);
}

CharacterNamespace.prototype.setScalarValue = function(key, value, cb) {
	this.getActiveCharacter(
		(err) => {
			if (err) return cb(err);

			this.activeCharacter[key] = value;
			this.activeCharacter.save(cb);
		}
	);
};

CharacterNamespace.prototype.getTableRow = function(tableName, key, cb) {
	throw new Error('here');
};

CharacterNamespace.prototype.setTableValue = function(tableName, key, value, cb) {
	throw new Error('here');
};

CharacterNamespace.prototype.getTableValueByKey = function(tableName, key, cb) {
	throw new Error('here');
};

module.exports = CharacterNamespace;