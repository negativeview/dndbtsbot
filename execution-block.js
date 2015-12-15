var stateHolderClass = require('./state-holder.js');
var async = require('async');

var ret = {};

function create(mongoose, bot, stateHolder) {
	var r2 = {
		statements: [],
		lineNumber: 0,
		stateHolder: stateHolder
	};

	stateHolder.init(mongoose, bot, r2);

	r2.setHandlers = function(handlers) {
		r2.handlers = handlers;
	}

	r2.spawn = function() {
		var b = ret.create(mongoose, bot, stateHolder);
		b.setHandlers(r2.handlers);
		return b;
	}

	r2.insertStatements = function(statements) {
		var argumentList = [
			r2.lineNumber,
			0
		];

		argumentList = argumentList.concat(statements);
		r2.statements.splice.apply(r2.statements, argumentList);
	};

	r2.addStatement = function(statement) {
		r2.statements.push(statement);
	};

	r2.setNext = function(next) {
		r2.next = next;
	};

	r2.execute = function() {
		if (r2.lineNumber == r2.statements.length) {
			if (r2.next) {
				return r2.next();
			} else {
				return r2.stateHolder.doFinalOutput();
			}
		}

		var statement = r2.statements[r2.lineNumber];

		r2.lineNumber++;
		r2.executeSingle(statement, stateHolder, r2.execute);
	};

	r2.executeSingle = function(message, stateHolder, next) {
		message = message.replace(/:: +/g, function(match, offset, string) {
			return '::';
		});
		if (message[0] == '!') {
			var pieces = message.split(" ");

			var fakeStateHolder = Object.create(stateHolder);
			fakeStateHolder.simpleAddMessage = function(to, message) {
				fakeStateHolder.result = message;
			};

			var newPieces = [];
			async.eachSeries(pieces, function(iterator, callback) {
				if (iterator[0] == '/' && iterator[1] == '/') {
					var variableName = iterator.slice(2);

					var matches = variableName.match(/([^\[]+)\[([^\]]+)\]/);
					if (matches) {
						var tableName = matches[1];
						var key = matches[2];

						r2.handlers.execute(
							'!table',
							[
								'!table',
								'get',
								'channel',
								tableName,
								key
							],
							fakeStateHolder,
							function() {
								newPieces.push(fakeStateHolder.result);
								callback();
							}
						);
					} else {
						r2.handlers.execute(
							'!var',
							[
								'!var',
								'get',
								'channel',
								variableName
							],
							fakeStateHolder,
							function() {
								newPieces.push(fakeStateHolder.result);
								callback();
							}
						);
					}			
				} else if (iterator[0] == ':' && iterator[1] == ':' && iterator.length > 2 && iterator[2] != "\n") {
					var variableName = iterator.slice(2);

					var matches = variableName.match(/([^\[]+)\[([^\]]+)\]/);
					if (matches) {
						var tableName = matches[1];
						var key = matches[2];

						r2.handlers.execute(
							'!table',
							[
								'!table',
								'get',
								'me',
								tableName,
								key
							],
							fakeStateHolder,
							function() {
								newPieces.push(fakeStateHolder.result);
								callback();
							}
						);
					} else {
						r2.handlers.execute(
							'!var',
							[
								'!var',
								'get',
								'me',
								variableName
							],
							fakeStateHolder,
							function() {
								newPieces.push(fakeStateHolder.result);
								callback();
							}
						);
					}
				} else {
					newPieces.push(iterator);
					callback();
				}
			}, function() {
				var command = newPieces[0];
				if (r2.handlers.findCommand(command)) {
					r2.handlers.execute(
						command,
						newPieces,
						stateHolder,
						next
					);
				} else {
					r2.handlers.macro(command, newPieces, stateHolder, next);
				}
			});
		}
	};

	return r2;
}

ret.create = create;

module.exports = ret;