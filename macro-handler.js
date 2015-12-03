var Dice = require('node-dice-js');

var ret = {
	macroModel: null
};

ret.init = function(mongoose) {
	var Schema = mongoose.Schema;
	var MacroSchema = new Schema({
		name: String,
		user: String,
		macro: String
	});
	mongoose.model('Macro', MacroSchema);

	ret.macroModel = mongoose.model('Macro');
};

ret.set = function(pieces, message, rawEvent, bot, channelID, globalHandler) {
	var username = rawEvent.d.author.id;
	if (pieces.length < 3) {
		bot.sendMessage({
			to: channelID,
			message: '@' + username + ' Invalid syntax.'
		});
		return;
	}
	var macroName = pieces[1];
	if (macroName[0] != '!') {
		macroName = '!' + macroName;
	}

	ret.macroModel.find({
		user: username,
		name: macroName
	}).exec(function(err, res) {
		if (err) {
			bot.sendMessage({
				to: username,
				message: err
			});
			return false;	
		}

		if (res.length) {
			for (var i = 0; i < res.length; i++) {
				var result = res[i];
				result.remove();
			}
		}

		var macroBody = '';
		for (var i = 2; i < pieces.length; i++) {
			macroBody += pieces[i] + ' ';
		}
		if (macroBody[0] != '!') {
			macroBody = '!' + macroBody;
		}

		var newMacro = new ret.macroModel(
			{
				name: macroName,
				macro: macroBody,
				user: username
			}
		);
		newMacro.save(function(err) {
			if (err) {
				bot.sendMessage({
					to: username,
					message: 'Error saving macro: ' + err
				});
				return;
			} else {
				bot.sendMessage({
					to: username,
					message: 'Saved macro `' + macroName + '`'
				});
				return;				
			}
		});
	});
};

ret.view = function(pieces, message, rawEvent, bot, channelID, globalHandler) {
	var username = rawEvent.d.author.id;

	ret.macroModel.find({
		user: username
	}).exec(function(err, res) {
		if (err) {
			bot.sendMessage({
				to: username,
				message: err
			});
			return;	
		}

		var answerMessage = '';
		if (res.length > 0) {
			for (var i = 0; i < res.length; i++) {
				answerMessage += '`' + res[i].name + '` ' + res[i].macro;
				if (i != res.length-1) {
					answerMessage += "\n";
				}
			}
		} else {
			answerMessage = 'No macros defined.';
		}

		bot.sendMessage({
			to: username,
			message: answerMessage
		});
	});
};

ret.remove = function(pieces, message, rawEvent, bot, channelID, globalHandler) {
	var username = rawEvent.d.author.id;

	var macroName = pieces[1];
	if (macroName[0] != '!') {
		macroName = '!' + macroName;
	}

	ret.macroModel.find({
		user: username,
		name: macroName
	}).exec(function(err, res) {
		if (err) {
			bot.sendMessage({
				to: username,
				message: err
			});
			return false;	
		}

		if (res.length) {
			for (var i = 0; i < res.length; i++) {
				var result = res[i];
				result.remove();
			}
		} else {
			bot.sendMessage({
				to: username,
				message: "Could not find the macro to remove."
			});
		}
	});	
};

ret.attempted = function(pieces, message, rawEvent, bot, channelID, globalHandler, next) {
	var username = rawEvent.d.author.id;

	ret.macroModel.find({
		user: username,
		name: pieces[0]
	}).exec(function(err, res) {
		if (err) {
			bot.sendMessage({
				to: username,
				message: err
			});
			next(pieces, message, rawEvent, bot, channelID, globalHandler, null);
			return;
		}

		if (res.length) {
			var result = res[0];
			globalHandler('', '', channelID, result.macro, rawEvent);
			return;
		}

		if (next)
			next(pieces, message, rawEvent, bot, channelID, globalHandler, null);
		return;
	});
};

module.exports = ret;