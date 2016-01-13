function CodeState() {
	this.variables = {};
	this.args = [];
	this.stack = [];
}

CodeState.prototype.addVariables = function(dictionary) {
	var keys = Object.keys(dictionary);
	for (var i = 0; i < keys.length; i++) {
		this.variables[keys[i]] = dictionary[keys[i]];
	}
}

CodeState.prototype.setArguments = function(arguments) {
	this.args = arguments;
}

module.exports = CodeState;