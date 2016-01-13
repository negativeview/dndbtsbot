function Variable(namespace, name) {
	this.namespace = namespace;
	this.name = name;
	this.type = 'variable';
	this.index = null;
}

Variable.prototype.setIndex = function(index) {
	this.index = index;
}

Variable.prototype.assign = function(value, cb) {
	if (this.index) {
		this.namespace.setTableValue(this.name, this.index, value, cb);
	} else {
		this.namespace.setScalarValue(this.name, value, cb);
	}
}

Variable.prototype.getScalarValue = function(cb) {
	if (this.index) {
		this.namespace.getTableValueByKey(this.name, this.index, cb);
	}
}

Variable.prototype.getTableValueByKey = function(key, cb) {
	return this.namespace.getTableValueByKey(key, cb);
};

module.exports = Variable;