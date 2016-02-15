function Character() {
	this.abilityScores = {
		strength: 10,
		dexterity: 10,
		constitution: 10,
		intelligence: 10,
		wisdom: 10,
		charisma: 10
	};
}

Character.prototype.getModifier = function(abilityName) {
	if (!(abilityName in this.abilityScores)) {
		throw new Error('No such ability: ' + abilityName);
	}

	var score = this.abilityScores[abilityName];
	var modifier = Math.floor((score - 10) / 2);

	return modifier;
}

module.exports = Character;