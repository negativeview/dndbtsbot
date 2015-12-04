module.exports = function() {
	var ret = {
		messages: {}
	};

	ret.init = function(mongoose, bot) {
		ret.mongoose = mongoose;
		ret.bot = bot;
	}

	ret.doFinalOutput = function() {
		for (var i in ret.messages) {
			var outputType = ret.messages[i];
			ret.bot.sendMessage(outputType);
		}
	};

	ret.simpleAddMessage = function(to, message) {
		if (!(to in ret.messages)) {
			ret.messages[to] = {
				to: to,
				message: ''
			};
		}

		if (ret.messages[to].message != '') {
			ret.messages[to].message += "\n";
		}
		ret.messages[to].message += message;
	}

	return ret;
}