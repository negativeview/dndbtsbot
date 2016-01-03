var async = require('async');

var ret = {};

ret.queue = [
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

ret.addAction = function(priority, method, message) {
	ret.queue[priority].messages.push(
		{
			method: method,
			arguments: message
		}
	);
};

ret.pump = function(bot, cb) {
	var messagesToSend = 1;

	var queueSizes = [];
	var totalMessages = 0;
	for (var i = 0; i < ret.queue.length; i++) {
		totalMessages += ret.queue[i].messages.length;
		queueSizes.push(i + ': ' + ret.queue[i].messages.length);
	}

	if (totalMessages == 0) return cb(0);

	async.eachSeries(
		ret.queue,
		function(queue, cb1) {
			async.whilst(
				function() {
					return queue.messages.length > 0;
				},
				function(cb2) {
					var message = queue.messages.shift();

					bot[message.method](message.arguments, function(err, msg) {
						if (err) {
							if (err.message == 'You are being rate limited') {
								queue.messages.push(message);
								return cb(err.retry_after);
							}
						}
						return cb2();
					});
				},
				function(err) {
					cb1();
				}
			)
		}, function() {
			var totalMessages = 0;
			for (var i = 0; i < ret.queue.length; i++) {
				totalMessages += ret.queue[i].messages.length;
				queueSizes.push(i + ': ' + ret.queue[i].messages.length);
			}

			if (totalMessages == 0) return cb(0);

			return cb(100);
		}
	);
};

module.exports = ret;