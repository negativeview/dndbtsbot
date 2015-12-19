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

ret.attack = function(pieces, stateHolder, next) {
	getActiveCharacter(stateHolder, next, function(activeCharacter) {
		for (var i = 0; i < activeCharacter.weapons.length; i++) {
			if (activeCharacter.weapons[i].isCurrent) {
				var weapon = activeCharacter.weapons[i];

				stateHolder.simpleAddMessage(stateHolder.channelID, "```" + activeCharacter.name + " Attacking With " + weapon.name + "```");

				var min = 1;
				var max = 20;
				var toHit = Math.floor(Math.random() * (max - min + 1)) + min;
				var modifier = scoreToModifier(activeCharacter[weapon.abilityScore]);
				var isCrit = false;
				if (toHit == 1) {
					toHit = "**Critical Miss**";
				} else if (toHit == 20) {
					isCrit = true;
					toHit = "**Critical**";
				} else {
					var actualToHit = parseInt(toHit) + parseInt(modifier) + parseInt(activeCharacter.proficiencyBonus);

					toHit = "1d20 (" + toHit + ") + " + modifier + " + " + activeCharacter.proficiencyBonus;
					if (weapon.magicModifier) {
						toHit += " + " + parseInt(weapon.magicModifier);
						actualToHit += parseInt(weapon.magicModifier);
					}
					toHit += " = **" + actualToHit + "**";
				}

				max = weapon.damageDie;

				var diceToRoll = '';
				if (isCrit) {
					diceToRoll = weapon.critRoll || '2d' + weapon.damageDie;
				} else {
					diceToRoll = weapon.normalRoll || '1d' + weapon.damageDie;
				}

				diceToRoll += '+' + modifier;

				if (weapon.magicModifier)
					diceToRoll += "+" + weapon.magicModifier;

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

module.exports = ret;