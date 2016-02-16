var Character = require('./character-sheet/character.js');

var async = require('async');
var weapons = require('./character-weapons.js');
var Dice = require('./dice.js');

var ret = {};

function getCharacterWrapper(stateHolder, parameters, fail, pass) {
	ret.characterModel.find(parameters).exec(
		(err, res) => {
			if (err) {
				stateHolder.simpleAddMessage(stateHolder.username, err);
				return fail();
			}

			if (res.length == 0) {
				stateHolder.simpleAddMessage(stateHolder.username, 'No current character set.');
				return fail();
			}

			return pass(res);
		}
	);
}

function getActiveCharacter(stateHolder, fail, pass) {
	var parameters = {
		user: stateHolder.username,
		isCurrent: true
	};

	return getCharacterWrapper(
		stateHolder,
		parameters,
		fail,
		(res) => {
			return pass(res[0]);
		}
	);
}

ret.init = function(mongoose, handlers) {
	ret.characterModel = mongoose.model('Character');
	ret.handlers = handlers;

	weapons.init(mongoose, handlers);

	var skills = [
		'acrobatics',
		'animalhandling',
		'arcana',
		'athletics',
		'deception',
		'history',
		'insight',
		'intimidation',
		'investigation',
		'medicine',
		'nature',
		'perception',
		'performance',
		'persuasion',
		'religion',
		'sleightofhand',
		'stealth',
		'survival'
	];

	var saves = [
		'strength',
		'dexterity',
		'constitution',
		'intelligence',
		'wisdom',
		'charisma'
	];
	
	for (var i = 0; i < skills.length; i++) {
		handlers.addHandler('!' + skills[i] + '2', ret.handleSkillRoll);
	}
	for (var i = 0; i < saves.length; i++) {
		handlers.addHandler('!' + saves[i] + '2', ret.handleSaveRoll);
	}
};

ret.handleSaveRoll = function(pieces, stateHolder, next) {
	var arguments = {};
	for (var i = 1; i < pieces.length; i++) {
		arguments[pieces[i]] = true;
	}

	var save = pieces[0].replace(/^!/, '');
	save = save.replace(/2$/, '');

	getActiveCharacter(
		stateHolder,
		next,
		(activeCharacter) => {
			var character = new Character(activeCharacter);
			character.getSave(
				save,
				stateHolder,
				arguments,
				(error, output) => {
					if (error) return next(error);

					stateHolder.simpleAddMessage(
						stateHolder.channelID,
						"```" + activeCharacter.name + " Rolling " + save + "```"
					);
					stateHolder.simpleAddMessage(stateHolder.channelID, output);

					return next();
				}
			);
		}
	);
};

ret.handleSkillRoll = function(pieces, stateHolder, next) {
	var arguments = {};
	for (var i = 1; i < pieces.length; i++) {
		arguments[pieces[i]] = true;
	}

	var skill = pieces[0].replace(/^!/, '');
	skill = skill.replace(/2$/, '');

	getActiveCharacter(
		stateHolder,
		next,
		(activeCharacter) => {
			var character = new Character(activeCharacter);
			character.getSkill(
				skill,
				arguments,
				(error, output) => {
					if (error) return next(error);

					stateHolder.simpleAddMessage(
						stateHolder.channelID,
						"```" + activeCharacter.name + " Rolling " + skill + "```"
					);
					stateHolder.simpleAddMessage(stateHolder.channelID, output);

					return next();
				}
			);
		}
	);
}

function doGet(pieces, stateHolder, activeCharacter, next) {
	if (pieces.length < 3) {
		return next('Usage: character get key');
	}

	var key = pieces[2];
	var character = new Character(activeCharacter);
	character.getVariable(
		key,
		stateHolder,
		(err, res) => {
			if (err) {
				stateHolder.simpleAddMessage(stateHolder.username, err);
			} else {
				stateHolder.simpleAddMessage(stateHolder.channelID, res);
			}
			return next();
		}
	);
}

ret.handle = function(pieces, stateHolder, next) {
	if (pieces.length == 1) {
		return doHelpText(pieces, stateHolder, next);
	}

	var command = pieces[1];

	var commandsWithoutState = ['delete', 'create', 'view', 'current'];

	if (commandsWithoutState.indexOf(command) != -1) {
		switch (command) {
			case 'delete':
				return doDelete(pieces, stateHolder, next);
			case 'create':
				return doCreate(pieces, stateHolder, next);
			case 'view':
				return doView(pieces, stateHolder, next);
			case 'current':
				return doCurrent(pieces, stateHolder, next);
		}
	}

	getActiveCharacter(
		stateHolder,
		next,
		(activeCharacter) => {
			switch(command) {
				case 'proficiency':
					return doProficiency(pieces, stateHolder, activeCharacter, next);
				case 'weapon':
					return weapons.doWeapon(pieces, stateHolder, activeCharacter, next);
				case 'set':
					return doSet(pieces, stateHolder, activeCharacter, next);
				case 'get':
					return doGet(pieces, stateHolder, activeCharacter, next);
				default:
					stateHolder.simpleAddMessage(stateHolder.username, 'No such character command: ' + pieces[1]);
					return next();
			}
		}
	);
};

module.exports = ret;