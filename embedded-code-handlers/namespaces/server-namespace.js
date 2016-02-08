var util = require('util');
var Namespace = require('./namespace.js');

function ServerNamespace(stateHolder) {
	Namespace.call(this, stateHolder);

	this.parameters = {
		server: stateHolder.serverID
	};
}

ServerNamespace.prototype.canEdit = function(cb) {
	var serverID = this.stateHolder.serverID;
	if (!serverID) return cb(null, false);

	if (this.stateHolder.isAdmin(this.stateHolder.username)) {
		return cb(null, true);
	}

	return cb(null, false);
}

util.inherits(ServerNamespace, Namespace);

module.exports = ServerNamespace;