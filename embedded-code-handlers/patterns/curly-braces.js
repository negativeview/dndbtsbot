var async  = require('async');
var helper = require('../helper.js');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');

function work(codeHandler, state, cb) {
	if (this.nodes.length != 3) {
		return cb('{} expects three sub-nodes. How did this even happen??');
	}

	var beforeNode = this.nodes[0];
	beforeNode.work(codeHandler, state, work2.bind(this, cb, codeHandler, state));
}

function work2(cb, codeHandler, state, error, value) {
	if (error) return cb(error);

	var insideNode = this.nodes[1];
	if ('result' in value) {
		this.wasIf = true;
		this.booleanValue = value.result;
		if (value.result) {
			insideNode.work(codeHandler, state, work3.bind(this, cb, codeHandler, state));
		} else {
			var f = work3.bind(this, cb, codeHandler, state);
			return f(null, null);
		}
	} else if ('toLoopOver' in value) {
		var m = this;
		async.eachSeries(
			value.toLoopOver,
			work4.bind(this, codeHandler, state, insideNode),
			function(error) {
				afterNode = m.nodes[2];
				if (afterNode.work) {
					afterNode.work(codeHandler, state, cb);
				} else {
					return cb(error, m);
				}
			}
		);
	} else {
		insideNode.work(codeHandler, state, work3.bind(this, cb, codeHandler, state));
	}
}

function work4(codeHandler, state, insideNode, variableOverrides, cb) {
	var keys = Object.keys(variableOverrides);
	for (var i = 0; i < keys.length; i++) {
		state.variables[keys[i]] = variableOverrides[keys[i]];
	}

	insideNode.work(codeHandler, state, function(error, res) {
		return cb(error);
	});
}

function work3(cb, codeHandler, state, error, value) {
	if (error) return cb(error);
	if (this.nodes[2].type == 'unparsed-node-list' && this.nodes[2].tokenList.length == 0) return cb();

	var afterNode = this.nodes[2];
	if (afterNode.type == 'ELSE' && this.wasIf) {
		afterNode.booleanValue = !this.booleanValue;
	}

	if (afterNode.work) {
		afterNode.work(codeHandler, state, cb);
	}
}

function toString() {
	var ret = '';

	ret += this.nodes[0].toString();
	ret += '{' + this.nodes[1].toString() + '}';
	if (this.nodes[2].type != 'unparsed-node-list')
		ret += this.nodes[2].toString();

	return ret;
}

module.exports = {
	name: 'Curly Braces',
	wasIf: false,
	booleanValue: false,
	matches: function(command) {
		var foundRight = false;
		for (var i = command.length - 1; i >= 0; i--) {
			if (command[i].type == 'RIGHT_CURLY') {
				foundRight = true;
				var count = 0;

				for (var m = i - 1; m >= 0; m--) {
					if (command[m].type == 'LEFT_CURLY') {
						if (count == 0) {
							return m;
						} else {
							count--;
						}
					} else if (command[m].type == 'RIGHT_CURLY') {
						count++;
					}
				}
			}
		}
		return false;
	},
	process: function(codeHandler, node, state, index, cb) {
		var before = new SyntaxTreeNode(node);
		for (var i = 0; i < index; i++) {
			var token = node.tokenList[i];
			before.tokenList.push(token);
		}
		node.addSubNode(before);

		var inside = new SyntaxTreeNode(node);
		var count = 0;
		for (var i = index + 1; i < node.tokenList.length; i++) {
			var token = node.tokenList[i];
			if (token.type == 'RIGHT_CURLY') {
				if (count == 0) {
					break;
				} else {
					count--;
				}
			} else if (token.type == 'LEFT_CURLY') {
				count++;
			}
			inside.tokenList.push(token);
		}
		node.addSubNode(inside);

		var after = new SyntaxTreeNode(node);
		for (i = i + 1; i < node.tokenList.length; i++) {
			var token = node.tokenList[i];
			after.tokenList.push(token);
		}
		node.addSubNode(after);

		node.strRep = '{}';
		node.work = work;
		node.type = 'CURLY BRACES';
		node.tokenList = [];
		node.toString = toString;

		return cb('', node);
	}
};
