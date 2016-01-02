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

ret.addMessage = function(priority, message) {
	console.log('Put message in queue');
	ret.queue[priority].messages.push(message);
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

	console.log('Pumping', queueSizes);

	async.eachSeries(
		ret.queue,
		function(queue, cb1) {
			async.whilst(
				function() {
					return queue.messages.length > 0;
				},
				function(cb2) {
					var message = queue.messages.shift();
					bot.sendMessage(message, function(a) {
						console.log(a);
					});
				},
				function(err) {
					cb1();
				}
			)
		}
	);
};

module.exports = ret;