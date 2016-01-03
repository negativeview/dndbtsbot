var Dice = require('./dice.js');
var ret = {};

var weaponKeys = [
	'name',
	'abilityScore',
	'damageType',
	'critRoll',
	'normalRoll',
	'magicModifier',
	'isCurrent'
];

ret.init = function(mongoose, handlers) {
	ret.mongoose = mongoose;
	ret.characterModel = mongoose.model('Character');
	ret.handlers = handlers;
};

function scoreToModifier(score) {
	return Math.floor((score - 10) / 2)
}

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

ret.outputWeapons = function(stateHolder, activeCharacter, next) {
	stateHolder.simpleAddMessage(stateHolder.username, "\n```Weapons```");
	if (activeCharacter.weapons.length == 0) {
		stateHolder.simpleAddMessage(stateHolder.username, "\nSadly, none.");
	} else {
		for (var i = 0; i < activeCharacter.weapons.length; i++) {
			var name = activeCharacter.weapons[i].name;
			if (!name) name = "Weapon";

			stateHolder.simpleAddMessage(stateHolder.username, "\n**" + name + "**\n");
			for (var m = 0; m < weaponKeys.length; m++) {
				if (weaponKeys[m] != "name") {
					stateHolder.simpleAddMessage(stateHolder.username, "__" + weaponKeys[m] + "__: " + activeCharacter.weapons[i][weaponKeys[m]] + "\n");
				}
			}
		}
	}
	next();
}

function doWeaponCreate(pieces, stateHolder, activeCharacter, next) {
	if (pieces.length < 4) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Wrong number of paramters to create a character weapon.');
		return next();
	}

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
			magicModifier: 0,
			isCurrent: isCurrent
		}
	);
	activeCharacter.markModified('weapons');
	activeCharacter.save(function(err) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Saved.');
		return next();
	});
}

function doWeaponSet(pieces, stateHolder, activeCharacter, next) {
	var finalParam = '';
	for (var i = 4; i < pieces.length; i++) {
		if (i != 4) finalParam = finalParam + ' ';
		finalParam = finalParam + pieces[i];
	}
	var key = pieces[3];
	var value = finalParam;

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
}

function doWeaponDrop(pieces, stateHolder, activeCharacter, next) {
	if (pieces.length < 4) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Wrong number of paramters to drop a weapon.');
		return next();
	}

	var finalParam = '';
	for (var i = 3; i < pieces.length; i++) {
		if (i != 3) finalParam = finalParam + ' ';
		finalParam = finalParam + pieces[i];
	}

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
}

ret.doWeapon = function(pieces, stateHolder, activeCharacter, next) {
	if (pieces.length == 2) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Wrong number of paramters to character weapon.');
		return next();		
	}

	switch (pieces[2]) {
		case 'create':
			return doWeaponCreate(pieces, stateHolder, activeCharacter, next);
		case 'drop':
			return doWeaponDrop(pieces, stateHolder, activeCharacter, next);
		case 'set':
			return doWeaponSet(pieces, stateHolder, activeCharacter, next);
		default:
			stateHolder.simpleAddMessage(stateHolder.username, 'Invalid key: ' + pieces[2]);
			return next();
	}
}

function attackFormat(stateHolder, activeCharacter, weapon, toHit, toHitString, damageRoll, damageValue) {
	var headerString = 
		"\n**" + activeCharacter.name + "** Attacking With **" + weapon.name + "**" +
		"```" + weapon.abilityScore + ": " + scoreToModifier(activeCharacter[weapon.abilityScore]) + 
		" | proficiency: " + activeCharacter.proficiencyBonus +
		" | damage type: " + weapon.damageType;
	headerString += " | attack roll (on die): " + toHit;
	headerString += " | damage roll: " + damageRoll;

	if (weapon.magicModifier) {
		headerString += " | magic: " + weapon.magicModifier;
	}

	stateHolder.simpleAddMessage(
		stateHolder.channelID,
		headerString
	);

	stateHolder.simpleAddMessage(stateHolder.channelID, "\n\nTo Hit: " + toHitString + "\n");
	stateHolder.simpleAddMessage(stateHolder.channelID, "Damage: " + damageValue);
	stateHolder.simpleAddMessage(stateHolder.channelID, "```");
}

function attackFormat2(stateHolder, activeCharacter, weapon, toHit, toHitString, damageRoll, damageValue) {
	var output = "\n*" + activeCharacter.name + " attacks with " + weapon.name + " (" + weapon.damageType + ")*";
	output    += "\n**To Hit:** " + toHitString;
	output    += "\n**Damage:** " + damageValue;

	stateHolder.simpleAddMessage(stateHolder.channelID, output);
}

ret.attack = function(pieces, stateHolder, next) {
	getActiveCharacter(stateHolder, next, function(activeCharacter) {
		var activeWeapon = null;

		if (pieces.length >= 2) {
			for (var i = 0; i < activeCharacter.weapons.length; i++) {
				var weapon = activeCharacter.weapons[i];
				if (weapon.name == pieces[1]) {
					activeWeapon = weapon;
					break;
				}
			}
		} else {
			for (var i = 0; i < activeCharacter.weapons.length; i++) {
				var weapon = activeCharacter.weapons[i];
				if (weapon.isCurrent) {
					activeWeapon = weapon;
					break;
				}
			}
		}

		if (activeWeapon) {
			weapon = activeWeapon;
			if (!weapon.abilityScore) {
				stateHolder.simpleAddMessage(stateHolder.username, "Need an abilityScore set for this weapon to be able to attack.");
				return next();
			}

			if (!activeCharacter.proficiencyBonus) {
				stateHolder.simpleAddMessage(stateHolder.username, "Character proficiencyBonus must be set to attack.");
				return next();
			}

			if (!weapon.normalRoll) {
				stateHolder.simpleAddMessage(stateHolder.username, "Weapon needs a normalRoll set to be able to attack.");
				return next();					
			}

			if (!weapon.critRoll) {
				stateHolder.simpleAddMessage(stateHolder.username, "Weapon needs a critRoll set to be able to attack.");
				return next();					
			}

			var dice = new Dice();

			var roll = '1d20 + ' + scoreToModifier(activeCharacter[weapon.abilityScore]) + ' + ' + parseInt(activeCharacter.proficiencyBonus);
			if (weapon.magicModifier) {
				roll += ' + ' + weapon.magicModifier;
			}
			dice.execute(roll, function(result) {
				var toHitOnDie = result.totalResult;
				var toHit = result.output;

				var isCrit = (toHitOnDie == 20);

				var diceToRoll = '';
				var damageRoll;
				if (isCrit) {
					damageRoll = weapon.critRoll;
					diceToRoll += weapon.critRoll || '2d' + weapon.damageDie;
				} else {
					damageRoll = weapon.normalRoll;
					diceToRoll += weapon.normalRoll || '1d' + weapon.damageDie;
				}

				diceToRoll += '+' + scoreToModifier(activeCharacter[weapon.abilityScore]);

				if (weapon.magicModifier)
					diceToRoll += "+" + weapon.magicModifier;

				dice.execute(diceToRoll, function(result) {
					var dieResults = [];
					for (var i = 0; i < result.rawResults.length; i++) {
						if (result.rawResults[i].type == 'die') {
							for (var m = 0; m < result.rawResults[i].results.length; m++) {
								dieResults[dieResults.length] = result.rawResults[i].results[m];
							}
						}
					}

					attackFormat2(stateHolder, activeCharacter, weapon, toHitOnDie, toHit, damageRoll, result.output);

					return next();				
				});
			});
			return;
		}
		stateHolder.simpleAddMessage(stateHolder.username, "No active weapon.");
		return next();
	});
};

module.exports = ret;