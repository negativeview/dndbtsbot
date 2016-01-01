var helper = require('../helper.js');

module.exports = {
	name: 'Boolean And',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['DELETE'],
				['SERVER', 'CHANNEL', 'USER'],
				['DOT'],
				['VARIABLE'],
				['SEMICOLON']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		var namespaceNode = command[index+1];
		var tableName = command[index+3].rawValue;

		var params = {
			name: tableName
		};

		switch (namespaceNode.type) {
			case 'USER':
				params.user = stateHolder.username;
				break;
			case 'SERVER':
				params.server = stateHolder.bot.serverFromChannel(stateHolder.channelID);
				break;
			case 'CHANNEL':
				params.channel = stateHolder.channelID;
				break;
		}

		var tableModel = stateHolder.mongoose.model('Table');
		tableModel.find(params).exec(
			function(err, res) {
				if (err) {
					for (var i = index + 5; i < command.length; i++) {
						tmpCommand.push(command[i]);
					}

					return cb(tmpCommand);					
				}

				if (res.length == 0) {
					for (var i = index + 5; i < command.length; i++) {
						tmpCommand.push(command[i]);
					}

					return cb(tmpCommand);
				}

				var table = res[0];
				table.remove();

				for (var i = index + 5; i < command.length; i++) {
					tmpCommand.push(command[i]);
				}

				return cb(tmpCommand);
			}
		);
	}
};
