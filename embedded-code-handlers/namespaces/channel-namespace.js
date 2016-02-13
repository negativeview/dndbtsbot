var util = require('util');
var Namespace = require('./namespace.js');

function ChannelNamespace(stateHolder) {
	Namespace.call(this, stateHolder);

	if (!stateHolder.serverID) {
		throw "Cannot access channel variables from a PM";
	}

	this.parameters = {
		channel: stateHolder.channelID
	};
}
util.inherits(ChannelNamespace, Namespace);

ChannelNamespace.prototype.canEdit = function(cb) {
	var serverID = this.stateHolder.serverID;
	if (!serverID) return cb(null, false);

	if (this.stateHolder.isAdmin(this.stateHolder.username)) {
		return cb(null, true);
	}

	return cb(null, false);
}

module.exports = ChannelNamespace;