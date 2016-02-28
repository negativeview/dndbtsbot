var util = require('util');
var Namespace = require('./namespace.js');

function UserNamespace(stateHolder) {
	Namespace.call(this, stateHolder);

	this.parameters = {
		user: stateHolder.username
	};
}
util.inherits(UserNamespace, Namespace);

UserNamespace.prototype.getScalarValue = function(key, cb) {
	if (key == 'name') {
		return cb(null, this.stateHolder.actualUsername);
	} else if (key == 'id') {
		return cb(null, this.stateHolder.username);
	}

	this.parameters.name = key;
	this.scalarModel.find(this.parameters).exec(
		(err, res) => {
			if (err) return cb(err);
			if (res.length == 0) return cb(null, '');
			return cb(null, res[0].value);
		}
	);
}

module.exports = UserNamespace;