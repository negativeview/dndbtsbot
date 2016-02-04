var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var CodeError = require('../base/code-error.js');
var AssignmentNode = require('../node-types/assignment-node.js');

function work(codeHandler, state, cb) {
	if (this.nodes.length != 2) {
		return cb('= excepts two sub-nodes. How did this even happen??');
	}

	var leftNode = this.nodes[0];
	var rightNode = this.nodes[1];

	switch (leftNode.type) {
		case 'BARE_STRING':
			assignToLocalVariable(leftNode, rightNode, cb);
			break;
		default:
			console.log(leftNode);
			throw new CodeError('Do not know how to assign to ' + leftNode.type, codeHandler, this);
	}
}

function assignToLocalVariable(state, leftNode, rightNode, cb) {
	switch (rightNode.type) {
		default:
			throw new CodeError('Do not know how to convert ' + rightNode.type + ' to string.', codeHandler, this);
	}
}

function work2(cb, codeHandler, state, error, value) {
	if (error) {
		return cb(error);
	}
	
	var leftHandSide = value;
	var rightNode = this.nodes[1];
	rightNode.work(
		codeHandler,
		state,
		(error, value) => {
			work3(cb, codeHandler, leftHandSide, state, error, value)
		}
	);
}

function work3(cb, codeHandler, leftHandSide, state, error, value) {
	var rightHandSide = value;

	switch (rightHandSide.type) {
		case 'QUOTED_STRING':
			rightHandSide = rightHandSide.strRep;
			break;
		default:
			throw new CodeError('When assigning to a variable, could not tell what right side was', codeHandler, this);
	}

	if (leftHandSide.type == 'VARIABLE') {
		leftHandSide.assign(rightHandSide, function(error) {
			if (error) {
				return cb(error);
			}
			return cb();
		});
	} else if (leftHandSide.type == 'BARE_STRING') {
		state.variables[leftHandSide.strRep] = rightHandSide;
		return cb();
	} else {
		return cb('I do not know how to assign to ' + leftHandSide.type);
	}
}

function toString() {
	return this.nodes[0].toString() + ' = ' + this.nodes[1].toString();
}

module.exports = {
	name: 'Assignment',
	matches: function(command) {
		for (var i = command.length - 1; i > 0; i--) {
			if (command[i].type == 'EQUALS') {
				return i;
			}
		}
		return false;
	},
	process: function(codeHandler, tokens, state, index, cb) {
		var node = new AssignmentNode(codeHandler);

		for (var i = 0; i < index; i++) {
			node.left.push(tokens[i]);
		}
		for (var i = index + 1; i < tokens.length; i++) {
			node.right.push(tokens[i]);
		}

		return cb('', node);
	}
};