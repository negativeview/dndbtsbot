var CodeState = require('../embedded-code-handlers/base/code-state.js');
var Dice = require('../dice.js');
var EmbeddedCodeHandler = require('../embedded-code-handlers/base/embedded-code-handler.js');

function Character(storedCharacter) {
	this.abilityScores = {
		strength: 10,
		dexterity: 10,
		constitution: 10,
		intelligence: 10,
		wisdom: 10,
		charisma: 10
	};

	this.saves = [
		{
			name: 'Strength',
			key: 'strength',
			proficiency: 0
		},
		{
			name: 'Dexterity',
			key: 'dexterity',
			proficiency: 0
		},
		{
			name: 'Constitution',
			key: 'constitution',
			proficiency: 0
		},
		{
			name: 'Intelligence',
			key: 'intelligence',
			proficiency: 0
		},
		{
			name: 'Wisdom',
			key: 'wisdom',
			proficiency: 0
		},
		{
			name: 'Charisma',
			key: 'charisma',
			proficiency: 0
		},
	];

	this.skills = [
		{
			name: 'Acrobatics',
			key: 'acrobatics',
			abilityScore: 'dexterity',
			proficiency: 0
		},
		{
			name: 'Animal Handling',
			key: 'animalhandling',
			abilityScore: 'wisdom',
			proficiency: 0
		},
		{
			name: 'Arcana',
			key: 'arcana',
			abilityScore: 'intelligence',
			proficiency: 0
		},
		{
			name: 'Athletics',
			key: 'athletics',
			abilityScore: 'strength',
			proficiency: 0
		},
		{
			name: 'Deception',
			key: 'deception',
			abilityScore: 'charisma',
			proficiency: 0
		},
		{
			name: 'History',
			key: 'history',
			abilityScore: 'intelligence',
			proficiency: 0
		},
		{
			name: 'Insight',
			key: 'insight',
			abilityScore: 'wisdom',
			proficiency: 0
		},
		{
			name: 'Intimidation',
			key: 'intimidation',
			abilityScore: 'charisma',
			proficiency: 0
		},
		{
			name: 'Investigation',
			key: 'investigation',
			abilityScore: 'intelligence',
			proficiency: 0
		},
		{
			name: 'Medicine',
			key: 'medicine',
			abilityScore: 'wisdom',
			proficiency: 0
		},
		{
			name: 'Nature',
			key: 'nature',
			abilityScore: 'intelligence',
			proficiency: 0
		},
		{
			name: 'Perception',
			key: 'perception',
			abilityScore: 'wisdom',
			proficiency: 0
		},
		{
			name: 'Performance',
			key: 'performance',
			abilityScore: 'charisma',
			proficiency: 0
		},
		{
			name: 'Persuasion',
			key: 'persuasion',
			abilityScore: 'charisma',
			proficiency: 0
		},
		{
			name: 'Religion',
			key: 'religion',
			abilityScore: 'intelligence',
			proficiency: 0
		},
		{
			name: 'Sleight of Hand',
			key: 'sleightofhand',
			abilityScore: 'dexterity',
			proficiency: 0
		},
		{
			name: 'Stealth',
			key: 'stealth',
			abilityScore: 'dexterity',
			proficiency: 0
		},
		{
			name: 'Survival',
			key: 'survival',
			abilityScore: 'wisdom',
			proficiency: 0
		}
	];

	this.computed = {
		saves: {
		},
		skills: {
		},
		variables: {
			ac: {
				comp: 'output = 10 + ((character.dexterity - 10) / 2)'
			}
		}
	};

	for (var i = 0; i < this.skills.length; i++) {
		this.computed.skills[this.skills[i].key] = {
			comp: 'output = roll("1d20 + " + ((character.' + this.skills[i].abilityScore + ' - 10) / 2))'
		};
	}

	for (var i = 0; i < this.saves.length; i++) {
		this.computed.saves[this.saves[i].key] = {
			comp: 'output = roll("1d20 + " + ((character.' + this.saves[i].key + ' - 10) / 2))'
		};
	}

	var keys = Object.keys(this.abilityScores);
	for (var i = 0; i < keys.length; i++) {
		if (storedCharacter[keys[i]]) this.abilityScores[keys[i]] = storedCharacter[keys[i]];
	}

	console.log(this.computed);
}

Character.prototype.getSave = function(saveName, stateHolder, arguments, cb) {
	if (saveName in this.computed.saves) {
		stateHolder.incomingVariables = {
		};

		for (var i = 0; i < arguments.length; i++) {
			stateHolder.incomingVariables[arguments[i]] = 1;
		}

		console.log(stateHolder.incomingVariables);

		var codeState = new CodeState();
		var embeddedCodeHandler = new EmbeddedCodeHandler(stateHolder, stateHolder.executionHelper.handlers);
		embeddedCodeHandler.executeString(
			this.computed.saves[saveName].comp,
			codeState,
			(err, res) => {
				if (err) return cb('Internal error while trying to compute ' + saveName + ': ' + err);

				if ('output' in codeState.variables) {
					var out = codeState.variables.output;
					switch (out.type) {
						case 'QUOTED_STRING':
							return cb(null, out.stringValue);
						case 'ROLL_RESULT':
							return cb(null, out.output);
					}
				}

				return cb('Internal error while trying to compute.' + JSON.stringify(codeState.variables));
			}
		);
		return;		
	}
	return cb('No such save: ' + saveName);
};

Character.prototype.getSkill = function(skillName, arguments, cb) {
	for (var i = 0; i < this.skills.length; i++) {
		if (this.skills[i].key == skillName) {
			var skill = this.skills[i];

			if (skill.customCalculation) {

			} else {
				var rollString = "1d20";

				if (arguments.advantage) {
					rollString = "2d20-H";
				} else if (arguments.disadvantage) {
					rollString = "2d20-L";
				}

				rollString += " + " + this.getModifier(skill.abilityScore);

				if (skill.proficiency) {
					rollString += " + " + (this.getProficiencyBonus() * parseInt(skill.proficiency));
				}

				var dice = new Dice();
				dice.execute(
					rollString,
					cb
				);
				return;
			}
		}
	}

	return cb('No such skill: ' + skillName);
};

Character.prototype.getModifier = function(abilityName) {
	if (!(abilityName in this.abilityScores)) {
		throw new Error('No such ability: ' + abilityName);
	}

	var score = this.abilityScores[abilityName];
	var modifier = Math.floor((score - 10) / 2);

	return modifier;
};

Character.prototype.getVariable = function(variableName, stateHolder, cb) {
	if (variableName in this.abilityScores) {
		return cb(null, this.abilityScores[variableName]);
	} else if (variableName in this.computed.variables) {
		stateHolder.incomingVariables = {
		};

		var codeState = new CodeState();
		var embeddedCodeHandler = new EmbeddedCodeHandler(stateHolder, stateHolder.executionHelper.handlers);
		embeddedCodeHandler.executeString(
			this.computed.variables[variableName].comp,
			codeState,
			(err, res) => {
				if (err) return cb('Internal error while trying to compute ' + variableName + ': ' + err);

				if ('output' in codeState.variables) {
					var out = codeState.variables.output;
					switch (out.type) {
						case 'QUOTED_STRING':
							return cb(null, out.stringValue);
					}
				}

				return cb('Internal error while trying to compute.');
			}
		);
	}
};

module.exports = Character;