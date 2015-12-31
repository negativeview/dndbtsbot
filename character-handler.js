var async = require('async');
var weapons = require('./character-weapons.js');

function filterInt(value) {
  if(/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
    return Number(value);
  return NaN;
}

function scoreToModifier(score) {
	return Math.floor((score - 10) / 2)
}

var saves = [
	'strength',
	'dexterity',
	'constitution',
	'intelligence',
	'wisdom',
	'charisma'
];

var keys = [
	'name',
	'strength',
	'dexterity',
	'constitution',
	'intelligence',
	'wisdom',
	'charisma',
	'spellcastingAbility',
	'proficiencyBonus',
	'ac',
	'hp',
	'isCurrent'
];

var skills = {
	'acrobatics': 'dexterity',
	'animalhandling': 'wisdom',
	'arcana': 'intelligence',
	'athletics': 'strength',
	'deception': 'charisma',
	'history': 'intelligence',
	'insight': 'wisdom',
	'intimidation': 'charisma',
	'investigation': 'intelligence',
	'medicine': 'wisdom',
	'nature': 'intelligence',
	'perception': 'wisdom',
	'performance': 'charisma',
	'persuasion': 'charisma',
	'religion': 'intelligence',
	'sleightofhand': 'dexterity',
	'stealth': 'dexterity',
	'survival': 'wisdom'
};

var ret = {
};

function getActiveCharacter(stateHolder, fail, pass) {
	var parameters = {
		user: stateHolder.username,
		isCurrent: true
	};

	ret.characterModel.find(parameters).exec(
		function(err, res) {
			if (err) {
				stateHolder.simpleAddMessage(stateHolder.username, err);
				return fail();
			}

			if (res.length == 0) {
				stateHolder.simpleAddMessage(stateHolder.username, 'No current character set.');
				return fail();
			}

			return pass(res[0]);
		}
	);
}

function handleSaveRoll(pieces, stateHolder, next) {
	var save = pieces[0].replace(/^!/, '');
	if (saves.indexOf(save) == -1) {
		stateHolder.simpleAddMessage(stateHolder.username, 'No such save: ' + save + '.');
		return next();
	}

	getActiveCharacter(stateHolder, next, function(activeCharacter) {
		stateHolder.simpleAddMessage(stateHolder.channelID, "```" + activeCharacter.name + " Rolling " + save + "```");

		var roll = '1d20';
		if (pieces.length > 1 && pieces[1] == 'advantage') {
			roll = '2d20kh1';
		} else if (pieces.length > 1 && pieces[1] == 'disadvantage') {
			roll = '2d20-L';
		}

		roll +=  '+' + scoreToModifier(activeCharacter[save]);

		var proficiency = 0;
		if (activeCharacter.newProficiencies[skill]) {
			proficiency = activeCharacter.newProficiencies[skill];
		} else if (activeCharacter.proficiencies.indexOf(skill) !== -1) {
			proficiency = 1;
		}

		if (proficiency) {
			roll += '+' + (activeCharacter.proficiencyBonus * parseInt(proficiency));
		}
		
		var fakeStateHolder = Object.create(stateHolder);
		fakeStateHolder.simpleAddMessage = function(to, message) {
			fakeStateHolder.result = message;
		};

		ret.handlers.execute(
			'!roll',
			[
				'!roll',
				roll
			],
			fakeStateHolder,
			function() {
				var skillResult = fakeStateHolder.result;
				stateHolder.simpleAddMessage(stateHolder.channelID, skillResult);
				return next();
			}
		);
	});	
}

function handleSkillRoll(pieces, stateHolder, next) {
	var skill = pieces[0].replace(/^!/, '');
	if (!(skills[skill])) {
		stateHolder.simpleAddMessage(stateHolder.username, 'No such skill.');
		return next();
	}

	getActiveCharacter(stateHolder, next, function(activeCharacter) {
		stateHolder.simpleAddMessage(stateHolder.channelID, "```" + activeCharacter.name + " Rolling " + skill + "```");

		var roll = '1d20';
		if (pieces.length > 1 && pieces[1] == 'advantage') {
			roll = '2d20kh1';
		} else if (pieces.length > 1 && pieces[1] == 'disadvantage') {
			roll = '2d20-L';
		}
		roll +=  '+' + scoreToModifier(activeCharacter[skills[skill]]);
		var proficiency = 0;
		if (activeCharacter.newProficiencies[skill]) {
			proficiency = activeCharacter.newProficiencies[skill];
		} else if (activeCharacter.proficiencies.indexOf(skill) !== -1) {
			proficiency = 1;
		}

		if (proficiency) {
			roll += '+' + (activeCharacter.proficiencyBonus * parseInt(proficiency));
		}
		
		var fakeStateHolder = Object.create(stateHolder);
		fakeStateHolder.simpleAddMessage = function(to, message) {
			fakeStateHolder.result = message;
		};

		ret.handlers.execute(
			'!roll',
			[
				'!roll',
				roll
			],
			fakeStateHolder,
			function() {
				var skillResult = fakeStateHolder.result;
				stateHolder.simpleAddMessage(stateHolder.channelID, skillResult);
				return next();
			}
		);
	});
}

ret.init = function(mongoose, handlers) {
	var Schema = mongoose.Schema;
	var CharacterSchema = new Schema({
		user: String,
		name: String,
		strength: Number,
		dexterity: Number,
		constitution: Number,
		intelligence: Number,
		wisdom: Number,
		charisma: Number,
		spellcastingAbility: String,
		proficiencyBonus: Number,
		ac: Number,
		hp: Number,
		maxHP: Number,
		isCurrent: Boolean,
		weapons: [
			{
				name: String,
				abilityScore: String,
				damageType: String,
				isCurrent: Boolean,
				critRoll: String,
				normalRoll: String,
				magicModifier: Number
			}
		],
		newProficiencies: {},
		proficiencies: [String]
	});
	mongoose.model('Character', CharacterSchema);

	ret.characterModel = mongoose.model('Character');
	ret.handlers = handlers;

	weapons.init(mongoose, handlers);
	
	var skillKeys = Object.keys(skills).sort();
	for (var i = 0; i < skillKeys.length; i++) {
		handlers.addHandler('!' + skillKeys[i], handleSkillRoll);
	}

	for (var i = 0; i < saves.length; i++) {
		handlers.addHandler('!' + saves[i], handleSaveRoll);
	}

};

function doHelpText(pieces, stateHolder, next) {
	return next();
}

function doListCharacters(pieces, stateHolder, next) {
	var parameters = {
		user: stateHolder.username,
	};

	ret.characterModel.find(parameters).exec(
		function(err, res) {
			if (err) {
				stateHolder.simpleAddMessage(stateHolder.username, err);
				return next();
			}

			for (var i = 0; i < res.length; i++) {
				if (i != 0) {
					stateHolder.simpleAddMessage(stateHolder.username, "\n");
				}
				stateHolder.simpleAddMessage(stateHolder.username, res[i].name);
			}

			return next();
		}
	);
}

function doSet(pieces, stateHolder, activeCharacter, next) {
	if (pieces.length < 4) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Wrong number of paramters to character set.');
		return next();
	}

	var finalParam = '';
	for (var i = 3; i < pieces.length; i++) {
		if (i != 3) finalParam = finalParam + ' ';
		finalParam = finalParam + pieces[i];
	}

	var key = pieces[2];
	var value = finalParam;

	if (key == 'weapon') {
		var foundIt = false;

		for (var i = 0; i < activeCharacter.weapons.length; i++) {
			if (activeCharacter.weapons[i].name == value) {
				activeCharacter.weapons[i].isCurrent = true;
				foundIt = true;
			} else {
				activeCharacter.weapons[i].isCurrent = false;
			}
		}

		activeCharacter.save(function(err) {
			if (err) console.log(err);
			return next();
		});
		return;
	}

	if (keys.indexOf(key) == -1) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Not a character variable.');
		return next();
	}

	if (key == 'isCurrent') {
		stateHolder.simpleAddMessage(stateHolder.username, 'Cannot set isCurrent that way.');
		return next();
	}

	activeCharacter[key] = value;
	activeCharacter.save();

	stateHolder.simpleAddMessage(stateHolder.username, 'Set ' + key);

	return next();
}

function doCurrent(pieces, stateHolder, next) {
	if (pieces.length == 2) {
		getActiveCharacter(stateHolder, next, function(activeCharacter) {
			stateHolder.simpleAddMessage(stateHolder.username, activeCharacter.name);
			return next();
		});
		return;
	}

	var parameters = {
		user: stateHolder.username,
		isCurrent: true
	};

	ret.characterModel.find(parameters).exec(
		function(err, res) {
			if (err) {
				stateHolder.simpleAddMessage(stateHolder.username, err);
				return next();
			}

			if (res.length != 0) {
				res[0].isCurrent = false;
				res[0].save();
			}

			parameters = {
				user: stateHolder.username,
				name: pieces[2]
			};

			ret.characterModel.find(parameters).exec(
				function (err, res) {
					if (err) {
						stateHolder.simpleAddMessage(stateHolder.username, err);
						return next();
					}

					if (res.length == 0) {
						stateHolder.simpleAddMessage(stateHolder.username, 'No such character.');
						return next();
					}

					res[0].isCurrent = true;
					res[0].save();
				}
			);
		}
	);
}

function doView(pieces, stateHolder, next) {
	if (pieces.length == 2) {
		return doListCharacters(pieces, stateHolder, next);
	}

	var characterName = pieces[2];

	var fakeStateHolder = Object.create(stateHolder);
	fakeStateHolder.simpleAddMessage = function(to, message) {
		fakeStateHolder.result = message;
	};

	ret.handlers.execute(
		'!var',
		[
			'!var',
			'get',
			'channel',
			'_dm'
		],
		fakeStateHolder,
		function() {
			var dmResult = fakeStateHolder.result;

			var parameters = {
				name: characterName
			};

			if (dmResult == stateHolder.username) {
			} else {
				parameters.user = stateHolder.username;
			}

			ret.characterModel.find(parameters).exec(
				function(err, res) {
					if (err) {
						stateHolder.simpleAddMessage(stateHolder.username, err);
						return next();
					}

					if (res.length == 0) {
						stateHolder.simpleAddMessage(stateHolder.username, 'No such character.');
						return next();
					}

					var character = res[0];

					stateHolder.simpleAddMessage(stateHolder.username, "```Basic Stats```\n");
					for (var i = 0; i < keys.length; i++) {
						var key = keys[i];

						stateHolder.simpleAddMessage(stateHolder.username, "__" + key + "__ -- " + character[key] + "\n");
					}

					weapons.outputWeapons(stateHolder, character, function() {
						stateHolder.simpleAddMessage(stateHolder.username, "\n```Skills```");
						var skillKeys = Object.keys(skills).sort();
						for (var i = 0; i < skillKeys.length; i++) {
							if (i != 0) {
								stateHolder.simpleAddMessage(stateHolder.username, "\n");
							}
							var skillValue = scoreToModifier(character[skills[skillKeys[i]]]);
							if (character.proficiencies.indexOf(skillKeys[i]) !== -1) {
								skillValue += character.proficiencyBonus;
							}
							stateHolder.squashAddMessage(stateHolder.username, "__" + skillKeys[i] + "__: " + skillValue);
						}

						stateHolder.simpleAddMessage(stateHolder.username, "\n\n```Proficiencies```");
						if (character.proficiencies.length == 0) {
							stateHolder.simpleAddMessage(stateHolder.username, "\nSadly, none.");
						} else {
							var outputString = '';
							for (var i = 0; i < character.proficiencies.length; i++) {
								if (i != 0) outputString += ', ';
								outputString += character.proficiencies[i] + '[1]';
							}

							console.log(character);

							var keys = [];
							if (character.newProficiencies) {
								keys = Object.keys(character.newProficiencies);
							}
							for (var i = 0; i < keys.length; i++) {
								if (!(i == 0 && character.proficiencies.length == 0)) {
									outputString += ', ';
								}
								outputString += keys[i] + '[' + character.newProficiencies[keys[i]] + ']';
							}

							stateHolder.squashAddMessage(stateHolder.username, outputString);
						}

						return next();
					});
				}
			);
		}
	);
}

function doCreate(pieces, stateHolder, next) {
	if (pieces.length == 2) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Usage: !character create <character name>');
		return next();
	}

	var characterName = pieces[2];

	var parameters = {
		user: stateHolder.username,
		name: characterName
	};

	ret.characterModel.find(parameters).exec(
		function(err, res) {
			if (err) {
				stateHolder.simpleAddMessage(stateHolder.username, err);
				return next();
			}

			if (res.length != 0) {
				for (var i = 0; i < res.length; i++) {
					res[i].remove();
				}

				stateHolder.simpleAddMessage(stateHolder.username, 'Deleted user.');
			} else {
				stateHolder.simpleAddMessage(stateHolder.username, 'No such user.');				
			}

			return next();
		}
	);
}

function doProficiency(pieces, stateHolder, activeCharacter, next) {
	if (pieces.length != 4) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Usage: !character proficiency <skill/save> <on/off>');
		return next();		
	}

	if (!activeCharacter.newProficiencies)
		activeCharacter.newProficiencies = {};

	if (pieces[3] == 'off' || pieces[3] == '0') {
		var indexOf = activeCharacter.proficiencies.indexOf(pieces[2]);
		if (indexOf != -1) {
			activeCharacter.proficiencies.splice(indexOf, 1);
		}
		delete activeCharacter.newProficiencies[pieces[2]];
		activeCharacter.save(function(err) {
			if (err) console.log(err);
			return next();
		});
	} else if (pieces[3] == 'on' || pieces[3] == '1') {
		var indexOf = activeCharacter.proficiencies.indexOf(pieces[2]);
		if (indexOf != -1) {
			activeCharacter.proficiencies.splice(indexOf, 1);
		}

		activeCharacter.newProficiencies[pieces[2]] = 1;
		activeCharacter.save(function(err) {
			if (err) console.log(err);
			return next();
		});
	} else if (pieces[3] == '2') {
		var indexOf = activeCharacter.proficiencies.indexOf(pieces[2]);
		if (indexOf != -1) {
			activeCharacter.proficiencies.splice(indexOf, 1);
		}

		activeCharacter.newProficiencies[pieces[2]] = 2;
		activeCharacter.save(function(err) {
			if (err) console.log(err);
			return next();
		});
	}
}

function doCreate(pieces, stateHolder, next) {
	if (pieces.length == 2) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Usage: !character create <character name>');
		return next();
	}

	var characterName = pieces[2];

	var parameters = {
		user: stateHolder.username,
		name: characterName
	};

	ret.characterModel.find(parameters).exec(
		function(err, res) {
			if (err) {
				stateHolder.simpleAddMessage(stateHolder.username, err);
				return next();
			}

			for (var i = 0; i < res.length; i++) {
				res[i].remove();
			}

			var newCharacter = new ret.characterModel(parameters);
			newCharacter.save(function(err) {
				if (err) {
					stateHolder.simpleAddMessage(stateHolder.username, err);
					return next();
				}

				stateHolder.simpleAddMessage(stateHolder.username, 'Created character.');
				return next();
			});
		}
	);
}

ret.attack = weapons.attack;

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

	getActiveCharacter(stateHolder, next, function(activeCharacter) {
		switch(command) {
			case 'proficiency':
				return doProficiency(pieces, stateHolder, activeCharacter, next);
			case 'weapon':
				return weapons.doWeapon(pieces, stateHolder, activeCharacter, next);
			case 'set':
				return doSet(pieces, stateHolder, activeCharacter, next);
			default:
				stateHolder.simpleAddMessage(stateHolder.username, 'No such character command: ' + pieces[1]);
				return next();
		}
	});
};

module.exports = ret;