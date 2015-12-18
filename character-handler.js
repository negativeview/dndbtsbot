var async = require('async');

function filterInt(value) {
  if(/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
    return Number(value);
  return NaN;
}

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

var weaponKeys = [
	'name',
	'abilityScore',
	'damageType',
	'critRoll',
	'normalRoll',
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
		roll +=  '+' + activeCharacter[skills[skill]];
		
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
				normalRoll: String
			}
		],
		proficiencies: [String]
	});
	mongoose.model('Character', CharacterSchema);

	ret.characterModel = mongoose.model('Character');
	ret.handlers = handlers;
	
	var skillKeys = Object.keys(skills).sort();
	for (var i = 0; i < skillKeys.length; i++) {
		handlers.addHandler('!' + skillKeys[i], handleSkillRoll);
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

function doWeaponCreate(pieces, stateHolder, next) {
	if (pieces.length < 4) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Wrong number of paramters to create a character weapon.');
		return next();
	}

	getActiveCharacter(stateHolder, next, function(activeCharacter) {
		var weaponName = '';
		for (var i = 3; i < pieces.length; i++) {
			if (weaponName != '') weaponName += ' ';
			weaponName += pieces[i];
		}

		var isCurrent = (activeCharacter.weapons.length == 0);

		activeCharacter.weapons.push(
			{
				name: weaponName,
				abilityScore: '',
				damageType: '',
				critRoll: '',
				normalRoll: '',
				isCurrent: isCurrent
			}
		);
		activeCharacter.markModified('weapons');
		activeCharacter.save(function(err) {
			stateHolder.simpleAddMessage(stateHolder.username, 'Saved.');
			return next();
		});
	});
}

function doWeaponSet(pieces, stateHolder, next) {
	var finalParam = '';
	for (var i = 4; i < pieces.length; i++) {
		if (i != 4) finalParam = finalParam + ' ';
		finalParam = finalParam + pieces[i];
	}
	var key = pieces[3];
	var value = finalParam;

	getActiveCharacter(stateHolder, next, function(activeCharacter) {
		for (var i = 0; i < activeCharacter.weapons.length; i++) {
			if (activeCharacter.weapons[i].isCurrent) {
				var weapon = activeCharacter.weapons[i];

				if (weaponKeys.indexOf(key) == -1) {
					stateHolder.simpleAddMessage(stateHolder.username, 'Not a weapon variable.');
					return next();
				}

				if (key == 'isCurrent') {
					stateHolder.simpleAddMessage(stateHolder.username, 'Cannot set isCurrent that way.');
					return next();
				}

				activeCharacter.weapons[i][key] = value;
				activeCharacter.save(function(err) {
					if (err) {
						stateHolder.simpleAddMessage(stateHolder.username, err);
						console.log(err);
					} else {
						stateHolder.simpleAddMessage(stateHolder.username, 'Saved weapon variable.');
					}

					return next();
				});

				return;
			}
		}

		stateHolder.simpleAddMessage(stateHolder.username, 'Must have an active weapon on an active character to use weapon set command.');
		return next();
	});	
}

function doWeaponDrop(pieces, stateHolder, next) {
	if (pieces.length < 4) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Wrong number of paramters to drop a weapon.');
		return next();
	}

	var finalParam = '';
	for (var i = 3; i < pieces.length; i++) {
		if (i != 3) finalParam = finalParam + ' ';
		finalParam = finalParam + pieces[i];
	}

	getActiveCharacter(stateHolder, next, function(activeCharacter) {
		for (var i = 0; i < activeCharacter.weapons.length; i++) {
			if (activeCharacter.weapons[i].name == finalParam) {
				activeCharacter.weapons.splice(i, 1);
				return activeCharacter.save(function(err) {
					if (err) { console.log(err); }

					stateHolder.simpleAddMessage(stateHolder.username, 'Dropped weapon ' + finalParam + ' from character ' + activeCharacter.name);
					return next();
				});
			}
		}
	});
}

function doWeapon(pieces, stateHolder, next) {
	if (pieces.length == 2) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Wrong number of paramters to character weapon.');
		return next();		
	}

	switch (pieces[2]) {
		case 'create':
			return doWeaponCreate(pieces, stateHolder, next);
		case 'drop':
			return doWeaponDrop(pieces, stateHolder, next);
		case 'set':
			return doWeaponSet(pieces, stateHolder, next);
		default:
			stateHolder.simpleAddMessage(stateHolder.username, 'Invalid key: ' + pieces[2]);
			return next();
	}
}

ret.attack = function(pieces, stateHolder, next) {
	getActiveCharacter(stateHolder, next, function(activeCharacter) {
		for (var i = 0; i < activeCharacter.weapons.length; i++) {
			if (activeCharacter.weapons[i].isCurrent) {
				var weapon = activeCharacter.weapons[i];

				stateHolder.simpleAddMessage(stateHolder.channelID, "```" + activeCharacter.name + " Attacking With " + weapon.name + "```");

				var min = 1;
				var max = 20;
				var toHit = Math.floor(Math.random() * (max - min + 1)) + min;
				var modifier = Math.floor((activeCharacter[weapon.abilityScore] - 10) / 2);
				var isCrit = false;
				if (toHit == 1) {
					toHit = "**Critical Miss**";
					isCrit = true;
				} else if (toHit == 20) {
					toHit = "**Critical**";
				} else {
					toHit = toHit + " + " + modifier + " + " + activeCharacter.proficiencyBonus + " = **" + (toHit + modifier + activeCharacter.proficiencyBonus) + "**";
				}

				max = weapon.damageDie;

				var diceToRoll = '';
				if (isCrit) {
					diceToRoll = weapon.critRoll || '2d' + weapon.damageDie;
				} else {
					diceToRoll = weapon.normalRoll || '1d' + weapon.damageDie;
				}

				var fakeStateHolder = Object.create(stateHolder);
				fakeStateHolder.simpleAddMessage = function(to, message) {
					fakeStateHolder.result = message;
				};

				ret.handlers.execute(
					'!roll',
					[
						'!roll',
						diceToRoll
					],
					fakeStateHolder,
					function() {
						var damageResult = fakeStateHolder.result;

						stateHolder.simpleAddMessage(stateHolder.channelID, "\nTo Hit: " + toHit + "\n");
						stateHolder.simpleAddMessage(stateHolder.channelID, "Damage: " + damageResult + "\n");
						stateHolder.simpleAddMessage(stateHolder.channelID, "Type: " + weapon.damageType + "\n");

						return next();
					}
				);
				return;
			}
		}
		stateHolder.simpleAddMessage(stateHolder.username, "No active weapon.");
		return next();
	});
};

function doSet(pieces, stateHolder, next) {
	if (pieces.length < 4) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Wrong number of paramters to character set.');
		return next();
	}

	var finalParam = '';
	for (var i = 3; i < pieces.length; i++) {
		if (i != 3) finalParam = finalParam + ' ';
		finalParam = finalParam + pieces[i];
	}

	getActiveCharacter(stateHolder, next, function(activeCharacter) {
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
	});
}

function doCurrent(pieces, stateHolder, next) {
	if (pieces.length == 2) {
		getActiveCharacter(stateHolder, next, function(activeCharacter) {
			stateHolder.simpleAddMessage(stateHolder.username, res[0].name);
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
			stateHolder.simpleAddMessage(stateHolder.username, "\n```Weapons```");
			if (character.weapons.length == 0) {
				stateHolder.simpleAddMessage(stateHolder.username, "\nSadly, none.");
			} else {
				for (var i = 0; i < character.weapons.length; i++) {
					var name = character.weapons[i].name;
					if (!name) name = "Weapon";

					stateHolder.simpleAddMessage(stateHolder.username, "\n**" + name + "**\n");
					for (var m = 0; m < weaponKeys.length; m++) {
						if (weaponKeys[m] != "name") {
							stateHolder.simpleAddMessage(stateHolder.username, "__" + weaponKeys[m] + "__: " + character.weapons[i][weaponKeys[m]] + "\n");
						}
					}
				}
			}
			stateHolder.simpleAddMessage(stateHolder.username, "\n```Skills```");
			var skillKeys = Object.keys(skills).sort();
			for (var i = 0; i < skillKeys.length; i++) {
				if (i != 0) {
					stateHolder.simpleAddMessage(stateHolder.username, "\n");
				}
				var skillValue = Math.floor((character[skills[skillKeys[i]]] - 10) / 2);
				if (character.proficiencies.indexOf(skillKeys[i]) !== -1) {
					skillValue += character.proficiencyBonus;
				}
				stateHolder.squashAddMessage(stateHolder.username, "__" + skillKeys[i] + "__: " + skillValue);
			}

			stateHolder.simpleAddMessage(stateHolder.username, "\n\n```Proficiencies```");
			if (character.proficiencies.length == 0) {
				stateHolder.simpleAddMessage(stateHolder.username, "\nSadly, none.");
			} else {
				stateHolder.squashAddMessage(stateHolder.username, character.proficiencies.join(', ') + "\n");
			}

			return next();
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

function doProficiency(pieces, stateHolder, next) {
	if (pieces.length != 4) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Usage: !character proficiency <skill/save> <on/off>');
		return next();		
	}

	getActiveCharacter(stateHolder, next, function(activeCharacter) {
		if (pieces[3] == 'off') {
			var indexOf = activeCharacter.proficiencies.indexOf(pieces[2]);
			if (indexOf != -1) {
				activeCharacter.proficiencies.splice(indexOf, 1);
				activeCharacter.save(function(err) {
					if (err) console.log(err);
					return next();
				});
			}
		} else if (pieces[3] == 'on') {
			var indexOf = activeCharacter.proficiencies.indexOf(pieces[2]);
			if (indexOf == -1) {
				activeCharacter.proficiencies.push(pieces[2]);
				activeCharacter.save(function(err) {
					if (err) console.log(err);
					return next();
				});
			}
		}
	});
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

ret.handle = function(pieces, stateHolder, next) {
	if (pieces.length == 1) {
		return doHelpText(pieces, stateHolder, next);
	}

	switch (pieces[1]) {
		case 'proficiency':
			return doProficiency(pieces, stateHolder, next);
		case 'weapon':
			return doWeapon(pieces, stateHolder, next);
		case 'current':
			return doCurrent(pieces, stateHolder, next);
		case 'delete':
			return doDelete(pieces, stateHolder, next);
		case 'create':
			return doCreate(pieces, stateHolder, next);
		case 'view':
			return doView(pieces, stateHolder, next);
		case 'set':
			return doSet(pieces, stateHolder, next);
		default:
			stateHolder.simpleAddMessage(stateHolder.username, 'No such character command: ' + pieces[1]);
			return next();
	}
};

module.exports = ret;