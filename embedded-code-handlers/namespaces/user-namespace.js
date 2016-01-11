var util = require('util');
var Namespace = require('./namespace.js');

function UserNamespace(stateHolder) {
	Namespace.call(this, stateHolder);

	this.parameters = {
		user: stateHolder.username
	};
}

util.inherits(UserNamespace, Namespace);

module.exports = UserNamespace;