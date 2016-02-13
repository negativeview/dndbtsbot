var util = require('util');
var Namespace = require('./namespace.js');

function CharacterNamespace(stateHolder) {
	Namespace.call(this, stateHolder);

	throw "Cannot do character namespace because no parameters set.";
}
util.inherits(CharacterNamespace, Namespace);

module.exports = CharacterNamespace;