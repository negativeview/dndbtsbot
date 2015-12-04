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

ret.set = function(pieces, message, rawEvent, channelID, globalHandler, stateHolder, next) {
	var username = rawEvent.d.author.id;
	if (pieces.length < 3) {
		stateHolder.simpleAddMessage(channelID, 'Invalid syntax.');
		return next();
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
			stateHolder.simpleAddMessage(username, err);
			return next();
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
				stateHolder.simpleAddMessage(username, 'Error saving macro: ' + err);
				return next();
			} else {
				stateHolder.simpleAddMessage(username, 'Saved macro `' + macroName + '`');
				return next();
			}
		});
	});
};

ret.view = function(pieces, message, rawEvent, channelID, globalHandler, stateHolder, next) {
	var username = rawEvent.d.author.id;

	ret.macroModel.find({
		user: username
	}).exec(function(err, res) {
		if (err) {
			stateHolder.simpleAddMessage(username, err);
			return next();	
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

		stateHolder.simpleAddMessage(username, answerMessage);
		return next();
	});
};

ret.remove = function(pieces, message, rawEvent, channelID, globalHandler, stateHolder, next) {
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
			stateHolder.simpleAddMessage(username, err);
			return next();
		}

		if (res.length) {
			for (var i = 0; i < res.length; i++) {
				var result = res[i];
				result.remove();
			}
			stateHolder.simpleAddMessage(username, 'Removed macro ' + result.name);
			return next();
		} else {
			stateHolder.simpleAddMessage(username, 'Could not find the macro to remove.');
			return next();
		}
	});	
};

ret.attempted = function(pieces, message, rawEvent, channelID, globalHandler, stateHolder, next) {
	var username = rawEvent.d.author.id;

	ret.macroModel.find({
		user: username,
		name: pieces[0]
	}).exec(function(err, res) {
		if (err) {
			stateHolder.simpleAddMessage(username, err);
			if (next)
				return next();
		}

		if (res.length) {
			var result = res[0];
			globalHandler('', '', channelID, result.macro, rawEvent, stateHolder);
			return;
		}

		if (next)
			next();
		return;
	});
};

module.exports = ret;