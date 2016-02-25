function CharacterAbilityScores(character, executionContext) {
	console.log(executionContext.variables);

	this.character    = character;
	this.strength     = executionContext.variables.character.strength.value;
	this.dexterity    = executionContext.variables.character.dexterity.value;
	this.constitution = executionContext.variables.character.constitution.value;
	this.intelligence = executionContext.variables.character.intelligence.value;
	this.wisdom       = executionContext.variables.character.wisdom.value;
	this.charisma     = executionContext.variables.character.charisma.value;
}

CharacterAbilityScores.prototype.getModifier = function(abilityName) {
	if (!(abilityName in this.abilityScores)) {
		throw new Error('No such ability: ' + abilityName);
	}

	var score = this.abilityScores[abilityName];
	var modifier = Math.floor((score - 10) / 2);

	return modifier;
};

CharacterAbilityScores.prototype.isAbilityScore = function(abilityName) {
	switch (abilityName) {
		case 'strength':
		case 'dexterity':
		case 'constitution':
		case 'intelligence':
		case 'wisdom':
		case 'charisma':
			return true;
		default:
			return false;
	}
}

CharacterAbilityScores.prototype.get = function(abilityName) {
	switch (abilityName) {
		case 'strength':
			return this.strength;
		case 'dexterity':
			return this.dexterity;
		case 'constitution':
			return this.constitution;
		case 'intelligence':
			return this.intelligence;
		case 'wisdom':
			return this.wisdom;
		case 'charisma':
			return this.charisma;
	}
}

module.exports = CharacterAbilityScores;