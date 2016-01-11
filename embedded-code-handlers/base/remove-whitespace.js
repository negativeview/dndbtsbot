/**
 * A silly short file that simply removes the whitespace nodes from our parse
 * tree. Once we've handled turning strings into actual string objects, we
 * don't care about whitespace AT ALL anymore, so we just remove them.
 */

module.exports = function(command, callback) {
	var res = command.filter(function(token) {
		return (token.type != 'WHITESPACE');
	});

	return callback(null, res);
}

