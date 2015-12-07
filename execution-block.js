var stateHolderClass = require('./state-holder.js');	

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

	r2.addStatement = function(statement) {
		r2.statements.push(statement);
	};

	r2.execute = function() {
		if (r2.lineNumber == r2.statements.length) return r2.stateHolder.doFinalOutput();

		var statement = r2.statements[r2.lineNumber];

		r2.lineNumber++;
		r2.executeSingle(statement, stateHolder, r2.execute);
	};

	r2.executeSingle = function(message, stateHolder, next) {
		if (message[0] == '!') {
			var pieces = message.split(" ");
			var command = pieces[0];
			if (r2.handlers.findCommand(command)) {
				r2.handlers.execute(
					command,
					pieces,
					stateHolder,
					next
				);
			} else {
				r2.handlers.macro(command, pieces, stateHolder, next);
			}
		}
	};

	return r2;
}

ret.create = create;

module.exports = ret;