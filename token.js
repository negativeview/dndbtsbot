var uuid = require('node-uuid');
var auth = require('./authenticate.js');

var preamble = auth.webURL + '/';

function Token(mongoose, bot) {
	this.mongoose = mongoose;
}

Token.prototype.handle = function(pieces, stateHolder, next) {
	var username = stateHolder.username;

	var model = this.mongoose.model('Token');
	model.find({user: username}).exec(
		(err, res) => {
			if (err) return next(err);

			if (res.length) {
				stateHolder.simpleAddMessage(username, 'Your token: ' + preamble + res[0].token);
				return next();
			}

			var t = uuid.v4();

			var params = {
				user: username,
				token: t
			};

			var token = new model(params);
			token.save(
				(err) => {
					if (err) return next(err);

					stateHolder.simpleAddMessage(username, 'Your token: ' + preamble + params.token);
					return next();
				}
			);
		}
	);
};

module.exports = Token;