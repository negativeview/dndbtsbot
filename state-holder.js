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

	ret.getMessage = function(to) {
		return ret.messages[to].message;
	}

	ret.clearMessages = function(to) {
		delete ret.messages[to];
	}

	ret.simpleAddMessage = function(to, message) {
		if (!(to in ret.messages)) {
			ret.messages[to] = {
				to: to,
				message: ''
			};
		}

		if (ret.messages[to].message.length > 0) {
			if (ret.messages[to].message[ret.messages[to].message.length-1] != "\n") {
				ret.messages[to].message += " ";
			}
		}
		ret.messages[to].message += message;
	}

	return ret;
}