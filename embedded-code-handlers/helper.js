var ret = {};

ret.filterInt = function(value) {
  if(/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
    return Number(value);
  return NaN;
};

ret.flatten = function(tokens) {
	var flat = '';
	for (var i = 0; i < tokens.length; i++) {
		if (i != 0) flat += ' ';
		flat += tokens[i].rawValue;
	}

	return flat;
};

ret.setHandlers = function(handlers) {
	ret.handlers = handlers;
};

ret.doesMatch = function(command, matchDefinition, notEnding) {
	var length = command.length - matchDefinition.length;
	for (var i = 0; i <= length; i++) {
		var found = true;

		for (var m = 0; m < matchDefinition.length; m++) {
			if (matchDefinition[m].indexOf(command[i + m].type) == -1) {
				found = false;
				break;
			} 
		}

		if (found) {
			if (notEnding) {
				var found2 = false;
				for (var m = 0; m < notEnding.length; m++) {
					if (notEnding[m].indexOf(command[i + 1].type) == -1) {
						found2 = true;
						break;
					}
				}
				if (found2) {
					continue;
				}
			}
			return i;
		}
	}

	return false;
};

function work2(cb, codeHandler, state, error, value) {
	if (error) return cb(error);

	var leftHandSide = value;
	if (leftHandSide.type == 'VARIABLE') {
		leftHandSide.getScalarValue(
			(error, value) => {
				work3(cb, codeHandler, state, value);
			}
		);
	} else if (leftHandSide.type == 'BARE_STRING') {
		if (state.variables[leftHandSide.strRep]) {
			work3(cb, codeHandler, state, state.variables[leftHandSide.strRep]);
		} else {
			work3(cb, codeHandler, state, leftHandSide.strRep);
		}
	} else {
		work3(cb, codeHandler, state, leftHandSide.strRep);
	}
}

function work3(cb, codeHandler, state, leftHandSide) {
	var rightNode = this.nodes[1];
	rightNode.work(
		codeHandler,
		state,
		(error, value) => {
			work4(cb, leftHandSide, codeHandler, state, error, value)
		}
	);
}

function work4(cb, leftHandSide, codeHandler, state, error, value) {
	if (error) return cb(error);
	var rightHandSide = value;
	if (rightHandSide.type == 'VARIABLE') {
		rightHandSide.getScalarValue(
			(error, result) => {
				cb(codeHandler, state, leftHandSide, result);
			}
		);
	} else if (rightHandSide.type == 'BARE_STRING') {
		if (state.variables[rightHandSide.strRep]) {
			cb(codeHandler, state, leftHandSide, state.variables[rightHandSide.strRep]);
		} else {
			cb(codeHandler, state, leftHandSide, rightHandSide.strRep);
		}
	} else {
		cb(codeHandler, state, leftHandSide, rightHandSide.strRep);
	}
}

ret.setupComparisonValues = function(node, codeHandler, state, cb) {
	leftNode = node.nodes[0];

	leftNode.work(
		codeHandler,
		state,
		(error, value) => {
			work2(cb, codeHandler, state, error, value);
		}
	);
};

module.exports = ret;