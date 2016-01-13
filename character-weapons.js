var Dice = require('./dice.js');
var ret = {};
var embeddedCodeHandler = require('./embedded-code-handler.js');

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

function doWeaponGrab(pieces, stateHolder, activeCharacter, next) {
	if (pieces.length < 4) {
		stateHolder.simpleAddMessage(stateHolder.username, "`!character weapon grab <weapon-id> <optional|your name for it>`");
		return next();
	}

	var weaponStoreModel = ret.mongoose.model('WeaponStore');
	var server = stateHolder.findServerID(stateHolder.channelID);
	if (!server) {
		stateHolder.simpleAddMessage(stateHolder.username, "This command must be run from a channel.");
		return next();
	}
	var params = {
		server: server,
		shortName: pieces[3]
	};
	weaponStoreModel.find(params).exec(function(err, results) {
		if (err) {
			stateHolder.simpleAddMessage(stateHolder.username, err);
			console.log(err);
			return next();
		}

		if (results.length == 0) {
			stateHolder.simpleAddMessage(stateHolder.username, 'No weapon found.');
			return next();
		}

		var weapon = results[0];

		var weaponName = '';
		for (var i = 4; i < pieces.length; i++) {
			if (weaponName != '') weaponName += ' ';
			weaponName += pieces[i];
		}
		if (weaponName == '') weaponName = weapon.name;

		var abilityScore = 'strength';
		if (weapon.properties.indexOf('versatile') != -1) {
			if (activeCharacter.dexterity > activeCharacter.strength) {
				abilityScore = 'dexterity';
			}
		}

		var isCurrent = (activeCharacter.weapons.length == 0);
		var re = new RegExp("([0-9]+)d([0-9]+)");
		var criticalRoll = weapon.damageRoll.match(re);
		if (criticalRoll) {
			criticalRoll = (parseInt(criticalRoll[1]) * 2) + 'd' + criticalRoll[2];
		}
		activeCharacter.weapons.push(
			{
				name: weaponName,
				abilityScore: abilityScore,
				damageType: weapon.damageType,
				critRoll: criticalRoll,
				normalRoll: weapon.damageRoll,
				magicModifier: 0,
				isCurrent: isCurrent,
				complexity: weapon.complexity,
				range: weapon.ragnge,
				cost: weapon.cost,
				weight: weapon.weight,
				properties: weapon.properties
			}
		);
		activeCharacter.markModified('weapons');
		activeCharacter.save(function(err) {
			stateHolder.simpleAddMessage(stateHolder.username, 'Saved.');
			return next();
		});



	});
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
		case 'grab':
			return doWeaponGrab(pieces, stateHolder, activeCharacter, next);
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

function attackFormat2(stateHolder, activeCharacter, weapon, toHit, toHitString, damageRoll, damageValue, footer) {
	var output = "\n*" + activeCharacter.name + " attacks with " + weapon.name + " (" + weapon.damageType + ")*";
	output    += "\n**To Hit:** " + toHitString;
	output    += "\n**Damage:** " + damageValue;

	if (footer) {
		output += "\n" + footer;
	}

	stateHolder.simpleAddMessage(stateHolder.channelID, output);
}

function modifyAttackRoll(roll, activeCharacter, stateHolder, next) {
	var mongoose = stateHolder.mongoose;
	var varModel = mongoose.model('Var');

	if (stateHolder.inAttackRoll) return next(roll);

	var params = {
		character: activeCharacter.id,
		name: 'modifyAttackRoll'
	};

	varModel.find(params).exec(function(err, res) {
		if (err) {
			stateHolder.simpleAddMessage(stateHolder.username, err);
			res = [];
		}

		if (res.length) {
			var code = res[0].value;

			var pieces = code.split(" ");
			pieces.unshift("!!");

			stateHolder.incomingVariables = {
				rollString: roll
			};

			stateHolder.inAttackRoll = true;
			embeddedCodeHandler.handle(pieces, stateHolder, function(err, res) {
				stateHolder.inAttackRoll = false;
				return next(res.variables.rollString);
			});
		} else {
			return next(roll);
		}
	});
}

function modifyDamageRoll(roll, attackRoll, activeCharacter, stateHolder, next) {
	var mongoose = stateHolder.mongoose;
	var varModel = mongoose.model('Var');

	if (stateHolder.inAttackRoll) return next(roll);

	var params = {
		character: activeCharacter.id,
		name: 'modifyDamageRoll'
	};

	varModel.find(params).exec(function(err, res) {
		if (err) {
			stateHolder.simpleAddMessage(stateHolder.username, err);
			res = [];
		}

		if (res.length) {
			var code = res[0].value;

			var pieces = code.split(" ");
			pieces.unshift("!!");

			var dieResult = 0;
			for (var i = 0; i < attackRoll.rawResults.length; i++) {
				if (attackRoll.rawResults[i].type == 'die') {
					if (attackRoll.rawResults[i].kept && attackRoll.rawResults[i].kept.length == 1) {
						dieResult = attackRoll.rawResults[i].kept[0];
						break;
					}
				}
			}

			stateHolder.incomingVariables = {
				rollString: roll,
				attackOnDie: dieResult
			};

			stateHolder.inAttackRoll = true;
			embeddedCodeHandler.handle(pieces, stateHolder, function(err, res) {
				stateHolder.inAttackRoll = false;
				return next(res.variables);
			});
		} else {
			return next({ rollString: roll });
		}
	});
}

function doAttack(activeCharacter, weapon, stateHolder, next) {
	var verified = stateHolder.verified;

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

	modifyAttackRoll(roll, activeCharacter, stateHolder, function(modifiedAttackRoll) {
		dice.execute(modifiedAttackRoll, function(result) {
			var toHitOnDie = 0;
			for (var i = 0; i < result.rawResults.length; i++) {
				if (result.rawResults[i].type == 'die') {
					toHitOnDie = result.rawResults[i].results[0];
					break;
				} else {
					console.log('type', result.rawResults[i].type);
				}
			}
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

			modifyDamageRoll(diceToRoll, result, activeCharacter, stateHolder, function(variables) {
				var modifiedDamageRoll = variables.rollString;
				var footer = variables.footer;

				dice.execute(modifiedDamageRoll, function(result) {
					var dieResults = [];
					for (var i = 0; i < result.rawResults.length; i++) {
						if (result.rawResults[i].type == 'die') {
							for (var m = 0; m < result.rawResults[i].results.length; m++) {
								dieResults[dieResults.length] = result.rawResults[i].results[m];
							}
						}
					}

					attackFormat2(stateHolder, activeCharacter, weapon, toHitOnDie, toHit, damageRoll, result.output, footer);

					stateHolder.verified = verified;
					return next();
				});
			});
		});
	});
}

ret.attack = function(pieces, stateHolder, next) {
	getActiveCharacter(stateHolder, next, function(activeCharacter) {
		var activeWeapon = null;

		if (pieces.length >= 2) {
			var weaponName = pieces[1];
			for (var i = 2; i < pieces.length; i++) {
				weaponName += ' ' + pieces[i];
			}

			for (var i = 0; i < activeCharacter.weapons.length; i++) {
				var weapon = activeCharacter.weapons[i];
				if (weapon.name == weaponName) {
					activeWeapon = weapon;
					break;
				}
			}
		}

		if (!activeWeapon) {
			for (var i = 0; i < activeCharacter.weapons.length; i++) {
				var weapon = activeCharacter.weapons[i];
				if (weapon.isCurrent) {
					activeWeapon = weapon;
					break;
				}
			}
		}

		if (activeWeapon) {
			return doAttack(activeCharacter, activeWeapon, stateHolder, next);
		}
		stateHolder.simpleAddMessage(stateHolder.username, "No active weapon.");
		return next();
	});
};

module.exports = ret;