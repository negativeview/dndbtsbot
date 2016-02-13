module.exports = function(mongoose) {
	var Schema = mongoose.Schema;

	var TokenSchema = new Schema({
		token: String,
		user: String
	});
	mongoose.model('Token', TokenSchema);

	var NewVarSchema = new Schema({
		/**
		 * Only one of these should be defined at a time.
		 */
		namespace: {
			user: String,
			channel: String,
			server: String,
			character: String,
		},
		creator: String,
		lastEditor: String,
		created: { type: Date, default: Date.now },
		lastEdited: { type: Date, default: Date.now },

		/**
		 * An array of strings that define where it's stored, such as
		 * server._preferences.users.RockGoliath.food = "apples" might have
		 * [
		 *   '_preferences',
		 *   'users',
		 *   'RockGoliath',
		 *   'food'
		 * ]
		 */
		path: [
			String
		],
		value: String,
		publicEdit: Boolean
	});
	mongoose.model('NewVar', NewVarSchema);

	var MacroSchema = new Schema({
		name: String,
		user: String,
		macro: String
	});
	mongoose.model('Macro', MacroSchema);

	var AdminMacroSchema = new Schema({
		name: String,
		server: String,
		macro: String
	});
	mongoose.model('AdminMacro', AdminMacroSchema);

	var VarSchema = new Schema({
		name: String,
		user: String,
		channel: String,
		server: String,
		value: String,
		character: String
	});
	mongoose.model('Var', VarSchema);

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
				magicModifier: Number,

				complexity: String,
				range: String,
				cost: Number,
				weight: Number,
				properties: [String]
			}
		],
		newProficiencies: {},
		proficiencies: [String]
	});
	mongoose.model('Character', CharacterSchema);

	var TableSchema = new Schema({
		name: String,
		user: String,
		channel: String,
		server: String,
		publicEdit: Boolean
	});
	mongoose.model('Table', TableSchema);

	var TableRowSchema = new Schema({
		table: String,
		key: String,
		value: String
	});
	mongoose.model('TableRow', TableRowSchema);

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
}