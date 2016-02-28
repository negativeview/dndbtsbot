var util = require('util');
var SyntaxTreeNode = require('../base/syntax-tree-node.js');
var helper = require('../helper.js');

function ParenthesisNode(codeHandler) {
	SyntaxTreeNode.call(this, codeHandler);
	this.type = 'PARENTHESIS';
	this.before = [];
	this.sub = [];
};
util.inherits(ParenthesisNode, SyntaxTreeNode);

ParenthesisNode.prototype.execute = function(parent, codeState, cb) {
	if (this.before.length) {
		this.codeHandler.handleTokenList(
			(error, result) => {
				this.executeSecond(cb, codeState, error, result);
			},
			codeState,
			null,
			this.before,
			this
		);
	} else {
		this.codeHandler.handleTokenList(
			(error, result) => {
				this.executeInnards(cb, codeState, error, result);
			},
			codeState,
			null,
			this.sub,
			this
		);
	}
}

ParenthesisNode.prototype.executeInnards = function(cb, codeState, error, value) {
	return cb(error, value);
}

ParenthesisNode.prototype.executeSecond = function(cb, codeState, error, value) {
	if (error) return cb(error);

	switch (value.type) {
		case 'IF':
			this.codeHandler.handleTokenList(
				(error, result) => {
					this.executeForIf(cb, value, error, result);
				},
				codeState,
				null,
				this.sub,
				this
			);			
			break;
		case 'TABLE':
			this.codeHandler.handleTokenList(
				(error, result) => {
					this.executeForTable(cb, value, error, result);
				},
				codeState,
				null,
				this.sub,
				this
			);
			break;
		case 'FOREACH':
			this.codeHandler.handleTokenList(
				(error, result) => {
					this.executeForForeach(cb, value, error, result);
				},
				codeState,
				null,
				this.sub,
				this
			);
			break;
		case 'ROLL':
			this.codeHandler.handleTokenList(
				(error, result) => {
					this.executeForRoll(cb, codeState, value, error, result);
				},
				codeState,
				null,
				this.sub,
				this
			);
			break;
		case 'BARE_STRING':
			this.handleMacro(
				value,
				codeState,
				cb
			);
			break;
		default:
			throw new Error('Not an if: ' + value.type);
	}
};

ParenthesisNode.prototype.handleMacro = function(node, codeState, cb) {
	if (!this.codeHandler.executionContext.allowedCommand(node)) {
		return cb('You cannot call ' + node + ' from itself.');
	}

	var adminModel = this.codeHandler.mongoose.model('AdminMacro');
	var params = {};
	params.name = node.stringValue;
	if (params.name[0] != '!')
		params.name = '!' + params.name;
	params.server = this.codeHandler.stateHolder.serverID;

	if (!params.server) {
		return this.handleUserMacro(node, codeState, cb);
	}

	adminModel.find(params).exec(
		(error, result) => {
			if (error) return cb(error);

			if (result.length) {
				console.log(this.codeHandler.stateHolder.isAdmin);
				this.codeHandler.stateHolder.isAdmin();
				var adminCache = this.codeHandler.stateHolder._isAdmin;
				return this.handleFoundMacro(result[0], codeState, (error, res) => {
					this.codeHandler.stateHolder._isAdmin = adminCache;
					return cb(error, res);
				});
			}

			return this.handleUserMacro(node, codeState, cb);
		}
	);
};

ParenthesisNode.prototype.handleFoundMacro = function(macro, codeState, cb) {
	this.codeHandler.handleTokenList(
		(error, result) => {
			if (error) return cb(error);

			helper.convertToString(
				result,
				codeState,
				(error, stringValue) => {
					if (error) return cb(error);

					var executionHelper = this.codeHandler.stateHolder.executionHelper;
					executionHelper.handle(
						macro.macro,
						(error, resultB) => {
							if (error) return cb(error);

							return cb(null, '');
						}
					);
				}
			);
		},
		codeState,
		null,
		this.sub,
		this
	);
};

ParenthesisNode.prototype.handleUserMacro = function(node, codeState, cb) {
	var model = this.codeHandler.mongoose.model('Macro');
	var params = {};
	params.name = node.stringValue;
	if (params.name[0] != '!')
		params.name = '!' + params.name;
	params.user = this.codeHandler.stateHolder.username;

	model.find(params).exec(
		(error, result) => {
			if (error) return cb(error);

			if (result.length) {
				return this.handleFoundMacro(result[0], codeState, cb);
			}

			return cb('No such macro found: ' + node.stringValue);
		}
	);
};

ParenthesisNode.prototype.executeForForeach = function(cb, foreachNode, error, node) {
	switch (node.type) {
		case 'VARIABLE':
			foreachNode.loopValue = node;
			return cb(null, foreachNode);
			break;
		default:
			console.log(node);
			throw new Error('Node!');
	}
};

ParenthesisNode.prototype.executeForTable = function(cb, tableNode, error, node) {
	switch (node.type) {
		case 'QUOTED_STRING':
			tableNode.executeString(node.stringValue, cb);
			break;
		default:
			console.log(node);
			throw new Error('Node!');
	}
};

ParenthesisNode.prototype.executeForRoll = function(cb, codeState, rollNode, error, node) {
	if (error) return cb(error);

	helper.convertToString(
		node,
		codeState,
		(error, stringValue) => {
			if (error) return cb(error);

			rollNode.executeString(stringValue, cb);
		}
	);
};

ParenthesisNode.prototype.executeForIf = function(cb, ifNode, error, node) {
	if (error) return cb(error);
	
	switch (node.type) {
		case 'BOOLEAN':
			ifNode.booleanValue = node.booleanValue;
			return cb(null, ifNode);
		default:
			throw new Error('If predicate is not a boolean, is ' + node.type);
	}
}

module.exports = ParenthesisNode;