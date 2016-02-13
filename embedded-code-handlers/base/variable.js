function Variable(namespace, name) {
	this.namespace = namespace;
	this.name = name;
	this.type = 'VARIABLE';
	this.index = null;
}

Variable.prototype.setIndex = function(index) {
	this.index = index;
}

Variable.prototype.assign = function(value, cb) {
	if (this.index != null) {
		this.namespace.setTableValue(this.name, this.index, value, cb);
	} else {
		this.namespace.setScalarValue(this.name, value, cb);
	}
}

Variable.prototype.getScalarValue = function(cb) {
	if (this.index != null) {
		this.namespace.getTableValueByKey(this.name, this.index, cb);
	} else {
		this.namespace.getScalarValue(this.name, cb);
	}
}

Variable.prototype.getTable = function(cb) {
	return this.namespace.getTable(this.name, cb);
}

Variable.prototype.getTableValueByKey = function(key, cb) {
	return this.namespace.getTableValueByKey(key, cb);
};

module.exports = Variable;