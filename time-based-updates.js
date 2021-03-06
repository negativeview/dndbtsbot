var async               = require('async');
var CodeState           = require('./embedded-code-handlers/base/code-state.js');
var EmbeddedCodeHandler = require('./embedded-code-handlers/base/embedded-code-handler.js');
var HandlerRegistry     = require('./utility-classes/handler-registry.js');
var moment              = require('moment');
var StateHolder         = require('./utility-classes/state-holder.js');

function TimeBasedUpdates(bot, mongoose, messageQueue) {
	this.bot = bot;
	this.messageQueue = messageQueue;
	this.mongoose = mongoose;
	this.updateHour = null;
}

TimeBasedUpdates.prototype.update = function(executionContext) {
	var m = moment().utc();
	var hours = m.hours();

	// Early bail.
	if (hours == this.updateHour) return;

	this.updateHour = hours;

	async.eachSeries(
		Object.keys(this.bot.servers),
		(serverID, cb) => {
			this.updateSingleServer(executionContext, serverID, cb);
		},
		() => { return; }
	);
};

TimeBasedUpdates.prototype.updateSingleServer = function(executionContext, serverID, cb) {
	var channels = Object.keys(this.bot.servers[serverID].channels);

	async.eachSeries(
		channels,
		(channelID, cb) => {
			this.updateSingleChannel(executionContext, serverID, channelID, cb);
		},
		() => { return cb(); }
	);
};

TimeBasedUpdates.prototype.updateSingleChannel = function(executionContext, serverID, channelID, cb) {
	var model = this.mongoose.model('Table');

	var params = {
		channel: channelID,
		name: '_settings'
	};

	model.find(params).exec(
		(error, table) => {
			this.updateSingleChannelBasedOnSettings(cb, executionContext, channelID, serverID, error, table);
		}
	);
};

TimeBasedUpdates.prototype.updateSingleChannelBasedOnSettings = function(cb, executionContext, channelID, serverID, error, table) {
	if (error) return cb(error);

	if (table.length == 0) return cb();

	var settings = table[0];
	var model = this.mongoose.model('TableRow');

	var parameters = {
		table: settings.id
	};

	model.find(parameters).exec(
		(error, rows) => {
			this.updateSingleChannelBasedOnRows(cb, executionContext, channelID, serverID, error, rows);
		}
	);
};

TimeBasedUpdates.prototype.updateSingleChannelBasedOnRows = function(cb, executionContext, channelID, serverID, error, rows) {
	if (error) return cb(error);
	if (rows.length == 0) return cb();

	var tableRebuild = {};
	for (var i = 0; i < rows.length; i++) {
		tableRebuild[rows[i].key] = rows[i].value;
	}

	var stateHolder         = new StateHolder(this.messageQueue, null, this.bot, this.mongoose, null, channelID, null);
	var handlerRegistry     = new HandlerRegistry(stateHolder, executionContext);
	var embeddedCodeHandler = new EmbeddedCodeHandler(stateHolder, handlerRegistry);

	var moment = require('moment');
	var m = moment().utc();
	m.subtract(7, 'hours');

	var hours = m.hours();

	var amPM = 'AM';
	if (hours > 12) {
		hours = hours - 12;
		amPM = 'PM';
	}

	if (hours == 0) hours = 12;

	var codeState = new CodeState();
	codeState.addVariables(
		{
			discord5eHour: hours,
			discord5eAMPM: amPM
		}
	);

	var m = this;
	if (tableRebuild.title) {
		embeddedCodeHandler.executeString(
			tableRebuild.title,
			codeState,
			(error, topLevelNode) => {
				if (error) {
					throw new Error(error);
				}

				var actualTopic = m.bot.servers[serverID].channels[channelID].topic;
				var newTopic = topLevelNode.codeHandler.codeState.variables.title;

				if (newTopic && newTopic.stringValue && newTopic.stringValue != actualTopic) {
					m.bot.editChannelInfo(
						{
							channel: channelID,
							topic: newTopic.stringValue
						}
					);
				}
			}
		);
	}

	return cb();
}

module.exports = TimeBasedUpdates;