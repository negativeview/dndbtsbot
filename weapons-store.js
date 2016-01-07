var async = require('async');

var ret = {};
module.exports = ret;

var bookWeapons = [
	{
		name: 'Club',
		shortName: 'club',
		complexity: 'Simple',
		range: 'Melee',
		cost: 10,
		damageRoll: '1d4',
		damageType: 'bludgeoning',
		weight: 2,
		properties: ['light']
	},
	{
		name: 'Dagger',
		shortName: 'dagger',
		complexity: 'Simple',
		range: 'Melee',
		cost: 200,
		damageRoll: '1d4',
		damageType: 'piercing',
		weight: 1,
		properties: ['finesse', 'light', 'thrown'],
		normalRange: 20,
		maximumRange: 60
	},
	{
		name: 'Greatclub',
		shortName: 'greatclub',
		complexity: 'Simple',
		range: 'Melee',
		cost: 20,
		damageRoll: '1d8',
		damageType: 'bludgeoning',
		weight: 10,
		properties: ['two-handed'],
	},
	{
		name: 'Handaxe',
		shortName: 'handaxe',
		complexity: 'Simple',
		range: 'Melee',
		cost: 500,
		damageRoll: '1d6',
		damageType: 'slashing',
		weight: 2,
		properties: ['light', 'thrown'],
		normalRange: 20,
		maximumRange: 60
	},
	{
		name: 'Javelin',
		shortName: 'javelin',
		complexity: 'Simple',
		range: 'Melee',
		cost: 50,
		damageRoll: '1d6',
		damageType: 'piercing',
		weight: 2,
		properties: ['thrown'],
		normalRange: 30,
		maximumRange: 120
	},
	{
		name: 'Light hammer',
		shortName: 'lighthammer',
		complexity: 'Simple',
		range: 'Melee',
		cost: 200,
		damageRoll: '1d4',
		damageType: 'bludgeoning',
		weight: 2,
		properties: ['light', 'thrown'],
		normalRange: 20,
		maximumRange: 60
	},
	{
		name: 'Mace',
		shortName: 'mace',
		complexity: 'Simple',
		range: 'Melee',
		cost: 500,
		damageRoll: '1d6',
		damageType: 'bludgeoning',
		weight: 4,
		properties: [],
	},
	{
		name: 'Quarterstaff',
		shortName: 'quarterstaff',
		complexity: 'Simple',
		range: 'Melee',
		cost: 20,
		damageRoll: '1d6',
		damageType: 'bludgeoning',
		weight: 4,
		properties: ['versatile'],
		twoHandedDamage: '1d8'
	},
	{
		name: 'Sickle',
		shortName: 'sickle',
		complexity: 'Simple',
		range: 'Melee',
		cost: 100,
		damageRoll: '1d4',
		damageType: 'slashing',
		weight: 2,
		properties: ['light']
	},
	{
		name: 'Unarmed Strike',
		shortName: 'unarmed',
		complexity: 'Simple',
		range: 'Melee',
		cost: 0,
		damageRoll: '1',
		damageType: 'bludgeoning',
		weight: 0,
		properties: []
	},
	{
		name: 'Crossbow, light',
		shortName: 'lightcrossbow',
		complexity: 'Simple',
		range: 'Ranged',
		cost: 2500,
		damageRoll: '1d8',
		damageType: 'piercing',
		weight: 5,
		properties: ['ammunition', 'loading', 'two-handed'],
		normalRange: 80,
		maximumRange: 320
	},
	{
		name: 'Dart',
		shortName: 'dart',
		complexity: 'Simple',
		range: 'Ranged',
		cost: 5,
		damageRoll: '1d4',
		damageType: 'piercing',
		weight: 0.25,
		properties: ['finesse', 'thrown'],
		normalRange: 20,
		maximumRange: 60
	},
	{
		name: 'Shortbow',
		shortName: 'shortbow',
		complexity: 'Simple',
		range: 'Ranged',
		cost: 2500,
		damageRoll: '1d6',
		damageType: 'piercing',
		weight: 2,
		properties: ['ammunition', 'two-handed'],
		normalRange: 80,
		maximumRange: 320
	},
	{
		name: 'Sling',
		shortName: 'sling',
		complexity: 'Simple',
		range: 'Ranged',
		cost: 10,
		damageRoll: '1d4',
		damageType: 'bludgeoning',
		weight: 0,
		properties: ['ammunition'],
		normalRange: 30,
		maximumRange: 120
	},
	{
		name: 'Battleaxe',
		shortName: 'battleaxe',
		complexity: 'Martial',
		range: 'Melee',
		cost: 1000,
		damageRoll: '1d8',
		damageType: 'slashing',
		weight: 4,
		properties: ['versatile'],
		twoHandedDamage: '1d10'
	},
	{
		name: 'Flail',
		shortName: 'flail',
		complexity: 'Martial',
		range: 'Melee',
		cost: 1000,
		damageRoll: '1d8',
		damageType: 'bludgeoning',
		weight: 2,
		properties: []
	},
	{
		name: 'Glaive',
		shortName: 'glaive',
		complexity: 'Martial',
		range: 'Melee',
		cost: 2000,
		damageRoll: '1d10',
		damageType: 'slashing',
		weight: 6,
		properties: ['heavy', 'reach', 'two-handed']
	},
	{
		name: 'Greataxe',
		shortName: 'greataxe',
		complexity: 'Martial',
		range: 'Melee',
		cost: 3000,
		damageRoll: '1d12',
		damageType: 'slashing',
		weight: 7,
		properties: ['heavy', 'two-handed']
	},
	{
		name: 'Greatsword',
		shortName: 'greatsword',
		complexity: 'Martial',
		range: 'Melee',
		cost: 5000,
		damageRoll: '2d6',
		damageType: 'slashing',
		weight: 6,
		properties: ['heavy', 'two-handed']
	},
	{
		name: 'Halberd',
		shortName: 'halberd',
		complexity: 'Martial',
		range: 'Melee',
		cost: 2000,
		damageRoll: '1d10',
		damageType: 'slashing',
		weight: 6,
		properties: ['heavy', 'reach', 'two-handed']
	},
	{
		name: 'Lance',
		shortName: 'lance',
		complexity: 'Martial',
		range: 'Melee',
		cost: 1000,
		damageRoll: '1d12',
		damageType: 'piercing',
		weight: 6,
		properties: ['reach', 'special']
	},
	{
		name: 'Longsword',
		shortName: 'longsword',
		complexity: 'Martial',
		range: 'Melee',
		cost: 1500,
		damageRoll: '1d8',
		damageType: 'slashing',
		weight: 3,
		properties: ['versatile'],
		twoHandedDamage: '1d10'
	},
	{
		name: 'Maul',
		shortName: 'maul',
		complexity: 'Martial',
		range: 'Melee',
		cost: 1000,
		damageRoll: '2d6',
		damageType: 'bludgeoning',
		weight: 10,
		properties: ['heavy', 'two-handed']
	},
	{
		name: 'Morningstar',
		shortName: 'morningstar',
		complexity: 'Martial',
		range: 'Melee',
		cost: 1500,
		damageRoll: '1d8',
		damageType: 'piercing',
		weight: 4,
		properties: []
	},
	{
		name: 'Pike',
		shortName: 'pike',
		complexity: 'Martial',
		range: 'Melee',
		cost: 500,
		damageRoll: '1d10',
		damageType: 'piercing',
		weight: 18,
		properties: ['heavy', 'reach', 'two-handed']
	},
	{
		name: 'Rapier',
		shortName: 'rapier',
		complexity: 'Martial',
		range: 'Melee',
		cost: 2500,
		damageRoll: '1d8',
		damageType: 'piercing',
		weight: 2,
		properties: ['finesse']
	},
	{
		name: 'Scimitar',
		shortName: 'scimitar',
		complexity: 'Martial',
		range: 'Melee',
		cost: 2500,
		damageRoll: '1d6',
		damageType: 'slashing',
		weight: 3,
		properties: ['finesse', 'light']
	},
	{
		name: 'Shortsword',
		shortName: 'shortsword',
		complexity: 'Martial',
		range: 'Melee',
		cost: 1000,
		damageRoll: '1d6',
		damageType: 'piercing',
		weight: 2,
		properties: ['finesse', 'light']
	},
	{
		name: 'Trident',
		shortName: 'trident',
		complexity: 'Martial',
		range: 'Melee',
		cost: 500,
		damageRoll: '1d6',
		damageType: 'piercing',
		weight: 4,
		properties: ['thrown', 'versatile'],
		normalRange: 20,
		maximumRange: 60,
		twoHandedDamage: '1d8'
	},
	{
		name: 'War Pick',
		shortName: 'warpick',
		complexity: 'Martial',
		range: 'Melee',
		cost: 500,
		damageRoll: '1d8',
		damageType: 'piercing',
		weight: 2,
		properties: [],
	},
	{
		name: 'Warhammer',
		shortName: 'warhammer',
		complexity: 'Martial',
		range: 'Melee',
		cost: 1500,
		damageRoll: '1d8',
		damageType: 'bludgeoning',
		weight: 2,
		properties: ['versatile'],
		twoHandedDamage: '1d10'
	},
	{
		name: 'Whip',
		shortName: 'whip',
		complexity: 'Martial',
		range: 'Melee',
		cost: 200,
		damageRoll: '1d4',
		damageType: 'slashing',
		weight: 3,
		properties: ['finesse', 'reach']
	},
	{
		name: 'Blowgun',
		shortName: 'blowgun',
		complexity: 'Martial',
		range: 'Ranged',
		cost: 1000,
		damageRoll: '1',
		damageType: 'piercing',
		weight: 1,
		properties: ['ammunition', 'loading'],
		normalRange: 25,
		maximumRange: 100
	},
	{
		name: 'Crossbow, hand',
		shortName: 'handcrossbow',
		complexity: 'Martial',
		range: 'Ranged',
		cost: 7500,
		damageRoll: '1d6',
		damageType: 'piercing',
		weight: 3,
		properties: ['ammunition', 'light', 'loading'],
		normalRange: 30,
		maximumRange: 120
	},
	{
		name: 'Crossbow, heavy',
		shortName: 'heavycrossbow',
		complexity: 'Martial',
		range: 'Ranged',
		cost: 5000,
		damageRoll: '1d10',
		damageType: 'piercing',
		weight: 18,
		properties: ['ammunition', 'heavy', 'loading', 'two-handed'],
		normalRange: 100,
		maximumRange: 400
	},
	{
		name: 'Longbow',
		shortName: 'longbow',
		complexity: 'Martial',
		range: 'Ranged',
		cost: 5000,
		damageRoll: '1d8',
		damageType: 'piercing',
		weight: 2,
		properties: ['ammunition', 'heavy', 'two-handed'],
		normalRange: 150,
		maximumRange: 600
	},
	{
		name: 'Net',
		shortName: 'net',
		complexity: 'Martial',
		range: 'Ranged',
		cost: 100,
		damageRoll: '0',
		damageType: 'none',
		weight: 3,
		properties: ['special', 'thrown'],
		normalRange: 5,
		maximumRange: 15
	}
];

ret.init = function(mongoose) {
	ret.mongoose = mongoose;

	var Schema = mongoose.Schema;
	var WeaponsStoreSchema = new Schema({
		server: String,
		name: String,
		shortName: String,
		complexity: String,
		range: String,
		cost: Number,
		damageRoll: String,
		damageType: String,
		weight: Number,
		properties: [String],
		twoHandedDamage: String,
		normalRange: Number,
		maximumRange: Number
	});
	mongoose.model('WeaponStore', WeaponsStoreSchema);
	ret.weaponStoreModel = mongoose.model('WeaponStore');

	ret.weaponStoreModel
};

function weaponFindWrap(parameters, stateHolder, earlyReturn, successReturn) {
	ret.weaponStoreModel.find(parameters).exec(function(err, weapons) {
		if (err) {
			console.log(err);
			stateHolder.simpleAddMessage(stateHolder.username, err);
			return earlyReturn();
		}

		return successReturn(weapons);
	});
}

function add(pieces, stateHolder, serverID, next) {
	if (pieces.length < 3) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Not enough arguments to this command. `!weaponstore add <shortname> <optional long name>`');
		return next();
	}

	var shortName = pieces[2];
	var longName = '';
	for (var i = 3; i < pieces.length; i++) {
		if (i != 3) longName += ' ';
		longName += pieces[i];
	}
	if (longName == '') {
		longName = shortName;
	}

	var parameters = {
		server: serverID,
		shortName: shortName
	};

	weaponFindWrap(parameters, stateHolder, next, function(weapons) {
		if (weapons.length != 0) {
			stateHolder.simpleAddMessage(stateHolder.username, 'Weapon `' + shortName + '` is already defined on this server.');
			return next();
		}

		parameters.name = longName;
		var newWeapon = new ret.weaponStoreModel(parameters);
		newWeapon.save(function(err) {
			if (err) {
				stateHolder.simpleAddMessage(stateHolder.username, err);
				return next();
			}

			stateHolder.simpleAddMessage(stateHolder.username, 'Weapon stored.');
			return next();
		});
	});
}

function list(pieces, stateHolder, serverID, next) {
	var parameters = { server: serverID };
	weaponFindWrap(parameters, stateHolder, next, function(weapons) {
		if (weapons.length == 0) {
			stateHolder.simpleAddMessage(stateHolder.username, 'There are no weapons defined on this server.');
			return next();
		}

		var msg = '';

		for (var i = 0; i < weapons.length; i++) {
			msg += "\n";
			msg += weapons[i].shortName + ' (' + weapons[i].complexity + ' ' + weapons[i].range + ')' + " - ";
			msg += weapons[i].damageRoll + ' ' + weapons[i].damageType;
		}

		stateHolder.simpleAddMessage(stateHolder.username, msg);
		return next();
	});
};

function formatPrice(inputPrice) {
	if (inputPrice < 10) {
		return inputPrice + 'cp';
	} else if (inputPrice < 100) {
		return (inputPrice / 10) + 'sp';
	} else {
		return (inputPrice / 100) + 'gp';
	}
}

function view(pieces, stateHolder, serverID, next) {
	if (pieces.length < 3) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Not enough parameters. `!weaponstore view <shortname`');
		return next();
	}

	var shortName = pieces[2];
	var parameters = {
		server: serverID,
		shortName: shortName
	};

	weaponFindWrap(parameters, stateHolder, next, function(weapons) {
		if (weapons.length == 0) {
			stateHolder.simpleAddMessage(stateHolder.username, 'No such weapon.');
			return next();
		}

		var weapon = weapons[0];
		var result  = "\n";
		    result += weapon.name + ' (' + weapon.shortName + ')' + "\n";
		    result += weapon.complexity + ' ' + weapon.range + "\n";
		    result += weapon.damageRoll + ' ' + weapon.damageType + "\n";
		    result += weapon.weight + 'lbs' + "\n";
		    result += formatPrice(weapon.cost) + "\n";
		    result += '[' + weapon.properties.join(', ') + ']' + "\n";

		stateHolder.simpleAddMessage(stateHolder.username, result);
		return next();
	});
}

function init(pieces, stateHolder, serverID, next) {
	var parameters = {
		server: serverID
	};
	weaponFindWrap(parameters, stateHolder, next, function(weapons) {
		async.eachSeries(
			bookWeapons,
			function(bookWeapon, callback) {
				var shortName = bookWeapon.shortName;
				var found = false;
				var existingWeapon;

				for (var m = 0; m < weapons.length; m++) {
					existingWeapon = weapons[m];

					if (existingWeapon.shortName == bookWeapon.shortName) {
						found = true;

						break;
					}
				}

				if (!found) {
					var existingWeapon = new ret.weaponStoreModel();
					existingWeapon.server = serverID;
					existingWeapon.shortName = shortName;
				}

				existingWeapon.name = bookWeapon.name;
				existingWeapon.complexity = bookWeapon.complexity;
				existingWeapon.range = bookWeapon.range;
				existingWeapon.cost = bookWeapon.cost;
				existingWeapon.damageRoll = bookWeapon.damageRoll;
				existingWeapon.damageType = bookWeapon.damageType;
				existingWeapon.weight = bookWeapon.weight;
				existingWeapon.properties = bookWeapon.properties;

				existingWeapon.save(function(err) {
					if (err) console.log(err);

					return callback();
				});
			},
			function(err) {
				return next();
			}
		);
	});
}

ret.handle = function(pieces, stateHolder, next) {
	var serverID = stateHolder.bot.serverFromChannel(stateHolder.channelID);
	if (!serverID) {
		stateHolder.simpleAddMessage(stateHolder.username, 'This command must be run from a channel.');
		return next();
	}

	if (pieces.length == 1) {
		command = 'list';
	} else {
		command = pieces[1];
	}

	switch (command) {
		case 'init':
			return init(pieces, stateHolder, serverID, next);
		case 'add':
			return add(pieces, stateHolder, serverID, next);
		case 'list':
			return list(pieces, stateHolder, serverID, next);
		case 'view':
			return view(pieces, stateHolder, serverID, next);
	}
}