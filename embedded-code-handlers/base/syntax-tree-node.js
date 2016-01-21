function SyntaxTreeNode(codeHandler) {
	this.codeHandler = codeHandler;
}

SyntaxTreeNode.prototype.execute = function() {
	throw new Error('Do not know how to execute ' + this.type);
};

module.exports = SyntaxTreeNode;