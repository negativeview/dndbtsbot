/**
 * If there is a bare word, we have to decide if that is a string or if it is
 * actually a variable. This file is basically those heuristics.
 */

var character = require('../character.js');
var channel   = require('../channel.js');
var server    = require('../server.js');
var user      = require('../user.js');

module.exports = function(ret, command) {
	var workingCommand = [];
	for (var m = 0; m < command.length; m++) {
		var token = command[m];
		if (token.type == 'STRING') {
			if (command.length >= m && command[m+1].type == 'LEFT_PAREN') {
				token = {
					rawValue: token.rawValue,
					type: 'FUNCTION'
				};
				workingCommand.push(token);
			} else if (ret.handlers.findCommand(token.rawValue)) {
				token = {
					rawValue: token.rawValue,
					type: 'FUNCTION'
				};
				workingCommand.push(token);
			} else {
				var pieces = token.rawValue.split(".");
				for (var n = 0; n < pieces.length; n++) {
					if (n != 0) {
						token = {
							rawValue: '.',
							type: 'DOT'
						}
						workingCommand.push(token);
					}
					if (n == 0 && pieces[n] == 'channel') {
						token = {
							rawValue: 'channel',
							object: channel(
								ret.stateHolder,
								ret.varModel,
								ret.tableModel,
								ret.tableRowModel
							),
							type: 'CHANNEL'
						};
					} else if (n == 0 && pieces[n] == 'user') {
						token = {
							rawValue: 'user',
							object: user(
								ret.stateHolder,
								ret.varModel,
								ret.tableModel,
								ret.tableRowModel
							),
							type: 'USER'
						};
					} else if (n == 0 && pieces[n] == 'character') {
						token = {
							rawValue: 'character',
							object: character(
								ret.stateHolder,
								ret.characterModel,
								ret.tableModel,
								ret.tableRowModel,
								ret.varModel
							),
							type: 'CHARACTER'
						};
					} else if (n == 0 && pieces[n] == 'server') {
						token = {
							rawValue: 'server',
							object: server(
								ret.stateHolder,
								ret.varModel,
								ret.tableModel,
								ret.tableRowModel
							),
							type: 'SERVER'
						};
					} else {
						token = {
							rawValue: pieces[n],
							type: 'VARIABLE',
						};
					}
					workingCommand.push(token);
				}
			}
		} else {
			workingCommand.push(token);
		}
	}
	return workingCommand;
}

