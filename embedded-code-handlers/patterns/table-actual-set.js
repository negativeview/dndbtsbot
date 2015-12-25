var helper = require('../helper.js');

module.exports = {
	name: 'Table actual set',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['TABLE'],
				['LEFT_BRACKET'],
				['QUOTED_STRING', 'NUMBER'],
				['RIGHT_BRACKET'],
				['EQUALS'],
				['QUOTED_STRING', 'NUMBER'],
				['SEMICOLON']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		var namespace = command[index].namespace;
		var name = command[index].name;
		var key = command[index+2].rawValue;
		var value = command[index+5].rawValue;

		var params = {
			name: name
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
			function(err, results) {
				if (err) {
					console.log(err);
				} else {
					if (results.length > 0) {
						var table = results[0];
						var tableID = table._id;

						var tableRowModel = stateHolder.mongoose.model('TableRow');
						var params = {
							table: tableID,
							key: key
						};

						tableRowModel.find(params).exec(
							function(err, results) {
								if (err) {
									console.log(err);
								} else {
									for (var i = 0; i < results.length; i++) {
										results[i].remove();
									}

									params.value = value;

									var newTableRow = new tableRowModel(params);
									newTableRow.save(function(err) {
										if (err) {
											console.log(err);
										}

										for (var i = index + 7; i < command.length; i++) {
											tmpCommand.push(command[i]);
										}

										return cb(tmpCommand);
									});
									return;
								}
							}
						);
						return;
					} else {
						stateHolder.real.simpleAddMessage(stateHolder.username, 'Unknown table: ' + name);
					}
				}

				for (var i = index + 7; i < command.length; i++) {
					tmpCommand.push(command[i]);
				}
				return cb(tmpCommand);
			}
		);
	}
};

