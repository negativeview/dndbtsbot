var util = require('util');
var Namespace = require('./namespace.js');

function ServerNamespace(stateHolder) {
	Namespace.call(this, stateHolder);

	this.parameters = {
		server: stateHolder.serverID
	};
}

util.inherits(ServerNamespace, Namespace);

module.exports = ServerNamespace;