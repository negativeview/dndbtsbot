var util = require('util');

function CodeError(description, codeHandler, node) {
	Error.call(description);

	this.node = node;
	this.codeHandler = codeHandler;
	this.description = description;
}
util.inherits(CodeError, Error);

CodeError.prototype.toString = function() {
	return this.description;
};

module.exports = CodeError;