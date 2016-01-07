var Dice = require('./dice.js');

var ret = {};

var games = [];
var gameByUser = {};

function ldCall(pieces, stateHolder, next) {
	var userID = stateHolder.username;

	for (var i = 0; i < games.length; i++) {
		var game = games[i];

		if (game.userA == userID || game.userB == userID) {
			return ldCallHandle(game, stateHolder, next);
		}
	}

	stateHolder.simpleAddMessage(stateHolder.username, 'I cannot find the game of liarsdice that you are in.');
	return next();
}

function ldCallHandle(game, stateHolder, next) {
	var activeUser = game.userA;
	var inactiveUser = game.userB;
	var myDice = game.userAResults;
	var theirDice = game.userBResults;
	if (game.activePlayer == 2) {
		activeUser = game.userB;
		inactiveUser = game.userA;
		myDice = game.userBResults;
		theirDice = game.userAResults;
	}

	var dieSize = game.latestBetSize;
	var betSize = game.latestBetNumber;

	var actualCount = 0;
	for (var i = 0; i < game.userAResults; i++) {
		if (game.userAResults[i] == dieSize) actualCount++;
	}
	for (var i = 0; i < game.userBResults; i++) {
		if (game.userBResults[i] == dieSize) actualCount++;
	}

	var won = true;
	if (actualCount > betSize) {
		won = false;
	}

	var message = '';
	message += "You won!\n";
	if (won) {
		message += "Your dice: " + myDice.join(', ') + "\n";
		message += "Their dice: " + theirDice.join(', ') + "\n";
		stateHolder.simpleAddMessage(activeUser, message);
	} else {
		message += "Your dice: " + theirDice.join(', ') + "\n";
		message += "Their dice: " + myDice.join(', ') + "\n";
		stateHolder.simpleAddMessage(activeUser, message);
	}

	var message = '';
	message += "You lost! You begin the next game.\n";
	if (won) {
		message += "Your dice: " + theirDice.join(', ') + "\n";
		message += "Their dice: " + myDice.join(', ') + "\n";
		stateHolder.simpleAddMessage(inactiveUser, message);
	} else {
		message += "Your dice: " + myDice.join(', ') + "\n";
		message += "Their dice: " + theirDice.join(', ') + "\n";
		stateHolder.simpleAddMessage(inactiveUser, message);
	}

	if (won) {
		if (game.activePlayer == 1) {
			game.activePlayer = 2;
			game.userBDiceNumber--;	
		} else {
			game.activePlayer = 1;
			game.userADiceNumber--;
		}
	} else {
		if (game.activePlayer == 1) {
			game.activePlayer = 1;
			game.userADiceNumber--;
		} else {
			game.activePlayer = 2;
			game.userBDiceNumber--;
		}
	}

	if (game.userADiceNumber <= 0) {
		stateHolder.simpleAddMessage(game.userA, 'You have lost the game.');
		stateHolder.simpleAddMessage(game.userB, 'You have won the game.');
		var index = games.indexOf(game);
		if (index != -1) {
			games.splice(index, 1);
		}
	} else if (game.userBDiceNumber <= 0) {
		stateHolder.simpleAddMessage(game.userB, 'You have lost the game.');
		stateHolder.simpleAddMessage(game.userA, 'You have won the game.');
		var index = games.indexOf(game);
		if (index != -1) {
			games.splice(index, 1);
		}
	}

	var dice = new Dice();
	setupDice(dice, game, stateHolder, next);
}

function setupDice(dice, game, stateHolder, next) {
	game.latestBetNumber = 0;
	game.latestBetSize = 0;
	dice.execute(game.userADiceNumber + 'd' + game.diceSize, function(data) {
		game.userAResults = data.rawResults[0].results;
		stateHolder.simpleAddMessage(
			game.userA,
			game.userAResults.join(', ')
		);

		dice.execute(game.userBDiceNumber + 'd' + game.diceSize, function(data) {
			game.userBResults = data.rawResults[0].results;
			stateHolder.simpleAddMessage(
				game.userB,
				game.userBResults.join(', ')
			);

			return next();
		});
	});
}

function ldStart(pieces, stateHolder, next) {
	if (pieces.length < 4) {
		stateHolder.simpleAddMessage(stateHolder.username, 'Invalid command. `!liarsdice start @otheruser 4d6`');
		return next();
	}

	var serverID = stateHolder.findServerID(stateHolder.channelID);
	if (!serverID) {
		stateHolder.simpleAddMessage(stateHolder.username, 'You must run this command from a server.');
		return next();
	}

	var userA = stateHolder.username;
	var userB = pieces[2].replace(/[\<\>\@]/g, '');
	var startingDice = pieces[3];

	var diceMatch = startingDice.match(/([0-9]+)d([0-9]+)/);
	if (!diceMatch) {
		stateHolder.simpleAddMessage(stateHolder.username, startingDice + ' does not look like a valid starting dice.');
		return next();
	}

	var diceSize = diceMatch[2];
	var startingDiceNumber = diceMatch[1];

	var game = {
		userA: userA,
		userB: userB,
		diceSize: diceSize,
		latestBetNumber: 0,
		latestBetSize: 0,
		userADiceNumber: startingDiceNumber,
		userBDiceNumber: startingDiceNumber,
		userAResults: [],
		userBResults: [],
		activePlayer: null
	};

	games[games.length] = game;

	var dice = new Dice();
	dice.execute('1d2', function(data) {
		var startingPlayer = stateHolder.actualUsername;
		if (data.totalResult == 1) {
			game.activePlayer = 1;
			startingPlayer = stateHolder.memberNumberToName(serverID, game.userB);
		} else {
			game.activePlayer = 2;
		}

		stateHolder.simpleAddMessage(
			stateHolder.channelID,
			'Started a game of liars dice between ' + stateHolder.actualUsername + ' and ' + stateHolder.memberNumberToName(serverID, game.userB) + "\n" +
			startingPlayer + ' starts. DMing the players their dice.'
		);

		setupDice(dice, game, stateHolder, next);
	});
}

function ldBetHandle(diceInfo, game, stateHolder, next) {
	var activeUser = game.userA;
	var inactiveUser = game.userB;
	if (game.activePlayer == 2) {
		activeUser = game.userB;
		inactiveUser = game.userA;
	}

	if (activeUser != stateHolder.username) {
		stateHolder.simpleAddMessage(stateHolder.username, 'It is not your turn.');
		return next();
	}

	if (
		diceInfo[1] > game.latestBetNumber || 
		(diceInfo[1] == game.latestBetNumber && diceInfo[2] > game.latestBetSize)
	) {
		game.latestBetNumber = diceInfo[1];
		game.latestBetSize = diceInfo[2];
		game.activePlayer = (game.activePlayer == 1) ? 2 : 1;

		stateHolder.simpleAddMessage(inactiveUser, 'The other user bet ' + diceInfo[1] + 'x' + diceInfo[2]);
		return next();
	} else {
		stateHolder.simpleAddMessage(stateHolder.username, 'Invalid bet.' + diceInfo.join(', '));
		return next();
	}
}

function ldBet(diceInfo, stateHolder, next) {
	var diceNumber = diceInfo[1];
	var diceSize = diceInfo[2];

	var userID = stateHolder.username;

	for (var i = 0; i < games.length; i++) {
		var game = games[i];

		if (game.userA == userID || game.userB == userID) {
			return ldBetHandle(diceInfo, game, stateHolder, next);
		}
	}

	stateHolder.simpleAddMessage(stateHolder.username, 'I cannot find the game of liarsdice that you are in.');
	return next();
}

ret.handle = function(pieces, stateHolder, next) {
	var command = pieces[1];

	switch (command) {
		case 'call':
			return ldCall(pieces, stateHolder, next);
		case 'start':
			return ldStart(pieces, stateHolder, next);
	}

	var diceInfo = command.match(/([0-9]+)x([0-9]+)/);
	if (diceInfo) {
		return ldBet(diceInfo, stateHolder, next);
	} else {
		stateHolder.simpleAddMessage(stateHolder.username, "Did not understand your bet: " + command);
		return next();
	}
};

module.exports = ret;