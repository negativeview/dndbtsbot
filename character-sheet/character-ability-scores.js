function CharacterAbilityScores(character) {
	this.character = character;
	this.strength = 10;
	this.dexterity = 10;
	this.constitution = 10;
	this.intelligence = 10;
	this.wisdom = 10;
	this.charisma = 10;
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