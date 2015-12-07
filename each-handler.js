var ret = {

};

ret.nop = function(pieces, stateHandler, next) {
	stateHandler.contextUser = pieces[1];
	next();
};


ret.each = function(pieces, stateHandler, next) {
	var statements = stateHandler.block.statements;
	var lineNumber = stateHandler.block.lineNumber;

	var toLoop = [];

	for (var i = lineNumber; i < statements.length; i++) {
		toLoop.push(statements[i]);
	}

	var roomRoleModel = stateHandler.mongoose.model('RoomRole');
	var parameters = {
		channel: stateHandler.channelID,
		roleName: pieces[1]
	};

	roomRoleModel.find(parameters).exec(function(err, res) {
		if (err) {
			return next();
		}

		var toInsert = [];
		for (var i = 0; i < res.length; i++) {
			var user = res[i].user;
			toInsert.push('!setuser ' + user);
			for (var p = 0; p < toLoop.length; p++) {
				toInsert.push(toLoop[p]);
			}
		}
		stateHandler.block.statements.splice(lineNumber, stateHandler.block.statements.length);
		for (var i = 0; i < toInsert.length; i++) {
			stateHandler.block.statements.push(toInsert[i]);
		}
		return next();
	});
};

module.exports = ret;