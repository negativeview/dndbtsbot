var util = require('util');
var Namespace = require('./namespace.js');

function ChannelNamespace(stateHolder) {
	Namespace.call(this, stateHolder);

	this.channelID = stateHolder.channelID;
	this.serverID = stateHolder.findServerID(this.channelID);
	if (!this.serverID) {
		throw "Cannot access channel variables from a PM";
	}

	this.parameters = {
		channel: this.channelID
	};
}
util.inherits(ChannelNamespace, Namespace);

ChannelNamespace.prototype.canEdit = function(cb) {
	var serverID = this.stateHolder.findServerID(this.stateHolder.channelID);
	if (!serverID) return cb(null, false);

	if (this.stateHolder.isAdmin(serverID, this.stateHolder.username)) {
		return cb(null, true);
	}

	return cb(null, false);
}

module.exports = ChannelNamespace;