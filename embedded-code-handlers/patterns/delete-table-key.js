var helper = require('../helper.js');

module.exports = {
	name: 'Boolean And',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['DELETE'],
				['TABLE'],
				['LEFT_BRACKET'],
				['QUOTED_STRING', 'NUMBER'],
				['RIGHT_BRACKET'],
				['SEMICOLON']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		var tableNode = command[index+1];
		var namespace = tableNode.namespace;
		var tableName = tableNode.name;
		var tableKey = command[index+3].rawValue;

		var params = {
			name: tableName
		};

		switch (namespace) {
			case 'user':
				params.user = stateHolder.username;
				break;
			case 'server':
				params.server = stateHolder.bot.serverFromChannel(stateHolder.channelID);
				break;
			case 'channel':
				params.channel = stateHolder.channelID;
				break;
		}

		var tableModel = stateHolder.mongoose.model('Table');
		tableModel.find(params).exec(
			function(err, res) {
				if (err) {
					for (var i = index + 6; i < command.length; i++) {
						tmpCommand.push(command[i]);
					}

					return cb(tmpCommand);					
				}

				if (res.length == 0) {
					for (var i = index + 6; i < command.length; i++) {
						tmpCommand.push(command[i]);
					}

					return cb(tmpCommand);
				}

				var table = res[0];
				var tableID = table._id;
				var tableRowModel = stateHolder.mongoose.model('TableRow');
				var params = {
					table: tableID,
					key: tableKey
				};
				tableRowModel.find(params).exec(
					function(err, results) {
						if (err) {
							for (var i = index + 6; i < command.length; i++) {
								tmpCommand.push(command[i]);
							}

							return cb(tmpCommand);							
						}

						if (results.length == 0) {
							for (var i = index + 6; i < command.length; i++) {
								tmpCommand.push(command[i]);
							}

							return cb(tmpCommand);
						}

						var row = results[0];
						row.remove();

						for (var i = index + 6; i < command.length; i++) {
							tmpCommand.push(command[i]);
						}

						return cb(tmpCommand);
					}
				);
			}
		);
	}
};
