var helper = require('../helper.js');

module.exports = {
	name: 'Table actual lookup',
	matches: function(command) {
		var index = helper.doesMatch(
			command,
			[
				['TABLE'],
				['LEFT_BRACKET'],
				['QUOTED_STRING'],
				['RIGHT_BRACKET']
			],
			['EQUALS']
		);
		return index;
	},
	work: function(stateHolder, index, command, state, handlers, execute, cb) {
		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		var namespace = command[index].namespace;
		var name = command[index].name;
		var key = command[index+2].rawValue;

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
					tmpCommand.push(
						{
							type: 'QUOTED_STRING',
							rawValue: ''
						}
					);
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
									tmpCommand.push(
										{
											type: 'QUOTED_STRING',
											rawValue: ''
										}
									);
								} else {
									if (results.length > 0) {
										var tableRow = results[0];

										tmpCommand.push(
											{
												type: 'QUOTED_STRING',
												rawValue: tableRow.value
											}
										);
									} else {
										tmpCommand.push(
											{
												type: 'QUOTED_STRING',
												rawValue: ''
											}
										);
									}
								}

								for (var i = index + 4; i < command.length; i++) {
									tmpCommand.push(command[i]);
								}

								return cb(tmpCommand);
							}
						);
						return;
					} else {
						tmpCommand.push(
							{
								type: 'QUOTED_STRING',
								rawValue: ''
							}
						);
					}
				}

				for (var i = index + 4; i < command.length; i++) {
					tmpCommand.push(command[i]);
				}

				return cb(tmpCommand);
			}
		);
	}
};

