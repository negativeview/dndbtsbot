var async = require('async');

function MessageQueue() {
	this.queue = [
		{
			name: 'High Priority',
			messages: []
		},
		{
			name: 'Medium Priority',
			messages: []
		},
		{
			name: 'Low Priority',
			messages: []
		}
	];
}

MessageQueue.prototype.addAction = function(priority, method, message) {
	this.queue[priority].messages.push(
		{
			method: method,
			arguments: message
		}
	);
}

MessageQueue.prototype.pump = function(bot, finalCallback) {
	var messagesToSend = 1;

	var queueSizes = [];
	var totalMessages = 0;
	for (var i = 0; i < this.queue.length; i++) {
		totalMessages += this.queue[i].messages.length;
		queueSizes.push(i + ': ' + this.queue[i].messages.length);
	}

	if (totalMessages == 0) return finalCallback(0);

	var m = this;

	async.eachSeries(
		m.queue,
		function(queue, queueCallback) {
			async.whilst(
				function() {
					return queue.messages.length > 0;
				},
				function(messageCallback) {
					var message = queue.messages.shift();

					bot[message.method](message.arguments, function(err) {
						if (err) {
							if (err.message == 'You are being rate limited') {
								queue.messages.push(message);
								return finalCallback(err.retry_after);
							}
						}

						return messageCallback();
					})
				},
				function() {
					queueCallback();
				}
			);
		},
		function() {
			var totalMessages = 0;
			for (var i = 0; i < m.queue.length; i++) {
				totalMessages += m.queue[i].messages.length;
				queueSizes.push(i + ': ' + m.queue[i].messages.length);
			}

			if (totalMessages == 0) return finalCallback(0);

			return finalCallback(100);
		}
	);
}

module.exports = MessageQueue;