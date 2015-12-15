var async = require('async');

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
	'damageDie',
	'damageType',
	'isCurrent'
];

var ret = {
};

ret.init = function(mongoose) {
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
				damageDie: Number,
				damageType: String,
				isCurrent: Boolean
			}
		]
	});
	mongoose.model('Character', CharacterSchema);

	ret.characterModel = mongoose.model('Character');
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
	if (pieces.length < 7) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Wrong number of paramters to create a character weapon.');
		return next();
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

			if (res.length == 0) {
				stateHolder.simpleAddMessage(stateHolder.username, 'No current character set.');
				return next();
			}

			var abilityScore = pieces[3];
			var damageDie = pieces[4];
			var damageType = pieces[5];

			var weaponName = '';
			for (var i = 6; i < pieces.length; i++) {
				if (weaponName != '') weaponName += ' ';
				weaponName += pieces[i];
			}

			res[0].weapons.push(
				{
					name: weaponName,
					abilityScore: abilityScore,
					damageDie: damageDie,
					damageType: damageType
				}
			);
			res[0].markModified('weapons');
			res[0].save(function(err) {
				stateHolder.simpleAddMessage(stateHolder.username, 'Saved.');
				return next();
			});
		}
	);
}

function doWeaponDrop(pieces, stateHolder, next) {
	console.log(pieces);
	return next();
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
		default:
			stateHolder.simpleAddMessage(stateHolder.username, 'Invalid key: ' + pieces[2]);
			return next();
	}
}

ret.attack = function(pieces, stateHolder, next) {
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

			if (res.length == 0) {
				stateHolder.simpleAddMessage(stateHolder.username, 'No current character set.');
				return next();
			}

			var character = res[0];

			for (var i = 0; i < character.weapons.length; i++) {
				if (character.weapons[i].isCurrent) {
					var weapon = character.weapons[i];

					stateHolder.simpleAddMessage(stateHolder.channelID, "```" + character.name + " Attacking With " + weapon.name + "```");

					var min = 1;
					var max = 20;
					var toHit = Math.floor(Math.random() * (max - min + 1)) + min;
					var modifier = Math.floor((character[weapon.abilityScore] - 10) / 2);
					if (toHit == 1) {
						toHit = "**Critical Miss**";
					} else if (toHit == 20) {
						toHit = "**Critical**";
					} else {
						toHit = toHit + " + " + modifier + " = **" + (toHit + modifier) + "**";
					}

					max = weapon.damageDie;
					var damage = Math.floor(Math.random() * (max - min + 1)) + min;
					damage = damage + " + " + modifier + " = **" + (damage + modifier) + "**";

					stateHolder.simpleAddMessage(stateHolder.channelID, "\nTo Hit: " + toHit + "\n");
					stateHolder.simpleAddMessage(stateHolder.channelID, "Damage: " + damage + "\n");
					stateHolder.simpleAddMessage(stateHolder.channelID, "Type: " + weapon.damageType + "\n");

					return next();
				}
			}

			stateHolder.simpleAddMessage(stateHolder.username, "No active weapon.");
			return next();
		}
	);
};

function doSet(pieces, stateHolder, next) {
	if (pieces.length != 4) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Wrong number of paramters to character set.');
		return next();
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

			if (res.length == 0) {
				stateHolder.simpleAddMessage(stateHolder.username, 'No current character set.');
				return next();
			}

			var key = pieces[2];
			var value = pieces[3];

			if (key == 'weapon') {
				var foundIt = false;

				for (var i = 0; i < res[0].weapons.length; i++) {
					if (res[0].weapons[i].name == value) {
						res[0].weapons[i].isCurrent = true;
						foundIt = true;
					} else {
						res[0].weapons[i].isCurrent = false;
					}
				}

				res[0].save(function(err) {
					console.log(err);
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

			res[0][key] = value;
			res[0].save();

			stateHolder.simpleAddMessage(stateHolder.username, 'Set ' + key);

			return next();
		}
	);
}

function doCurrent(pieces, stateHolder, next) {
	if (pieces.length == 2) {
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

				if (res.length == 0) {
					stateHolder.simpleAddMessage(stateHolder.username, 'No current character.');
					return next();
				}

				stateHolder.simpleAddMessage(stateHolder.username, res[0].name);
				return next();
			}
		);
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
	}
};

module.exports = ret;