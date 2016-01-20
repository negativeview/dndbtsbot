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

function work2(cb, stateHolder, state, error, value) {
	console.log('work2', value);

	if (error) return cb(error);

	var w3 = work3.bind(this);

	var leftHandSide = value;
	if (leftHandSide.type == 'VARIABLE') {
		leftHandSide.getScalarValue(
			function(error, value) {
				w3(cb, stateHolder, state, value);
			}
		);
	} else if (leftHandSide.type == 'STRING') {
		if (state.variables[leftHandSide.strRep]) {
			w3(cb, stateHolder, state, state.variables[leftHandSide.strRep]);
		} else {
			w3(cb, stateHolder, state, leftHandSide.strRep);
		}
	} else {
		w3(cb, stateHolder, state, leftHandSide.strRep);
	}
}

function work3(cb, stateHolder, state, leftHandSide) {
	var rightNode = this.nodes[1];
	rightNode.work(stateHolder, state, work4.bind(this, cb, leftHandSide, stateHolder, state));
}

function work4(cb, leftHandSide, stateHolder, state, error, value) {
	if (error) return cb(error);
	var rightHandSide = value;
	if (rightHandSide.type == 'VARIABLE') {
		var cb = cb.bind(this, stateHolder, state, leftHandSide);
		rightHandSide.getScalarValue(
			function(error, result) {
				cb(result);
			}
		);
	} else if (rightHandSide.type == 'STRING') {
		if (state.variables[rightHandSide.strRep]) {
			cb(stateHolder, state, leftHandSide, state.variables[rightHandSide.strRep]);
		} else {
			cb(stateHolder, state, leftHandSide, rightHandSide.strRep);
		}
	} else {
		cb(stateHolder, state, leftHandSide, rightHandSide.strRep);
	}
}

ret.setupComparisonValues = function(node, stateHolder, state, cb) {
	leftNode = node.nodes[0];

	leftNode.work(
		stateHolder,
		state,
		work2.bind(
			node,
			cb,
			stateHolder,
			state
		)
	);
};

module.exports = ret;