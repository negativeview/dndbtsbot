var helper = require('../helper.js');

module.exports = {
	name: 'Math and concatenation',
	matches: function(command) {
		return helper.doesMatch(
			command,
			[
				['QUOTED_STRING', 'NUMBER'],
				['PLUS', 'MINUS', 'ASTERISK', 'FORWARDSLASH'],
				['QUOTED_STRING', 'NUMBER']
			]
		);
	},
	work: function(stateHolder, index, command, state, handlers, cb) {
		var val1 = command[index].rawValue;
		var val2 = command[index + 2].rawValue;

		var tmpCommand = [];
		for (var i = 0; i < index; i++) {
			tmpCommand.push(command[i]);
		}

		var num1 = parseInt(val1);
		var num2 = parseInt(val2);

		switch(command[index+1].type) {
			case 'ASTERISK':						
				tmpCommand.push(
				{
					type: 'NUMBER',
					rawValue: num1 * num2
				});
				break;
			case 'FORWARDSLASH':
				tmpCommand.push(
				{
					type: 'NUMBER',
					rawValue: Math.floor(num1 / num2)
				});
				break;
			case 'MINUS':						
				tmpCommand.push(
				{
					type: 'NUMBER',
					rawValue: num1 - num2
				});
				break;
			case 'PLUS':
				if (!isNaN(helper.filterInt(val1)) && !isNaN(helper.filterInt(val2))) {
					tmpCommand.push(
					{
						type: 'NUMBER',
						rawValue: helper.filterInt(val1) + helper.filterInt(val2)
					});
				} else {
					tmpCommand.push(
					{
						type: 'QUOTED_STRING',
						rawValue: val1 + val2
					});
				}
				break;
		}
		for (var i = index + 3; i < command.length; i++) {
			tmpCommand.push(command[i]);
		}

		return cb(tmpCommand);
	}
};