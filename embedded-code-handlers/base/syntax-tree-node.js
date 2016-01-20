function SyntaxTreeNode(parent) {
	this.nodes = [];
	this.parent = parent;
	this.strRep = "Unset";
	this.type = 'unparsed-node-list';
	this.tokenList = [];
}

SyntaxTreeNode.prototype.addSubNode = function(subNode) {
	this.nodes.push(subNode);
};

SyntaxTreeNode.prototype.retString = function(indent) {
	var ret = "";
	var indentString = '';
	for (var i = 0; i < indent; i++) {
		indentString += '  ';
	}
	ret += indentString + this.strRep + "\n";

	if (this.nodes.length) {
		for (var i = 0; i < this.nodes.length; i++) {
			var str = this.nodes[i].retString(indent+1);
			ret += str;
		}
	} else {
		for (var i = 0; i < this.trees.length; i++) {
			ret += '  ' + indentString + this.trees[i].join(', ') + "\n";
		}
	}

	return ret;
}

SyntaxTreeNode.prototype.evaluate = function() {
	for (var i = 0; i < this.nodes.length; i++) {
		this.nodes[i].evaluate();
	}
};

module.exports = SyntaxTreeNode;