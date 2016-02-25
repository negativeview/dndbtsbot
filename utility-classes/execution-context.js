function ExecutionContext(bot, rawEvent) {
	this.stack = [];
	this.channel = rawEvent.d.channel_id;
	this.author = rawEvent.d.author;
	this.server = bot.serverFromChannel(this.channel);
	this.bot = bot;
	this.character = null;

	this.variables = {
		user: {},
		channel: {},
		server: {},
		character: {},
		weapon: {}
	};
}

ExecutionContext.prototype.allowedCommand = function(command) {
	for (var i = 0; i < this.stack.length; i++) {
		if (this.stack[i] == command) {
			return false;
		}
	}
	return true;
}

ExecutionContext.prototype.addCommand = function(command) {
	this.stack.push(command);
}

ExecutionContext.prototype.removeCommand = function(command) {
	if (this.stack[this.stack.length-1] == command) {
		this.stack.pop();
	} else {
		throw new Error('Trying to remove an element from the stack that is not at the end: ' + command);
	}
}

ExecutionContext.prototype.preseedVariables = function(mongoose, cb) {
	var model = mongoose.model('Var');
	this.preseedUserVariables(
		model,
		() => {
			model = mongoose.model('Character');
			var parameters = {
				user: this.author.id,
				isCurrent: true
			};
			model.find(parameters).exec(
				(error, res) => {
					if (res.length == 0) return cb();

					this.character = res[0];

					var variables = ['name', 'wisdom', 'strength', 'intelligence', 'dexterity', 'constitution', 'charisma'];

					for (var i = 0; i < variables.length; i++) {
						var variable = variables[i];

						this.variables.character[variable] = {
							src: 'MONGOOSE:CHARACTER',
							modified: false,
							value: this.character[variable]
						};
					}

					for (var i = 0; i < this.character.weapons.length; i++) {
						var weapon = this.character.weapons[i];
						if (weapon.isCurrent) {
							var variables = ['weight', 'cost', 'complexity', 'magicModifier', 'normalRoll', 'critRoll', 'damageType', 'abilityScore', 'name'];

							for (var i = 0; i < variables.length; i++) {
								var variable = variables[i];

								this.variables.weapon[variable] = {
									src: 'MONGOOSE:WEAPON',
									modified: false,
									value: weapon[variable]
								};
							}
							break;
						}
					}

					return cb();
				}
			);
		}
	);
};

ExecutionContext.prototype.preseedUserVariables = function(model, cb) {
	var params = {
		user: this.author.id
	};
	model.find(params).exec(
		(error, res) => {
			for (var i = 0; i < res.length; i++) {
				this.variables.user[res[i].name] = {
					src: 'MONGOOSE:USER',
					modified: false,
					variable: res[i]
				};
			}

			this.preseedChannelVariables(model, cb);
		}
	);
}

ExecutionContext.prototype.preseedChannelVariables = function(model, cb) {
	var params = {
		channel: this.channel
	};
	model.find(params).exec(
		(error, res) => {
			for (var i = 0; i < res.length; i++) {
				this.variables.channel[res[i].name] = {
					src: 'MONGOOSE:CHANNEL',
					modified: false,
					variable: res[i]
				};
			}

			this.preseedServerVariables(model, cb);
		}
	);
};

ExecutionContext.prototype.preseedServerVariables = function(model, cb) {
	if (!this.server) return cb();

	var params = {
		server: this.server
	};
	model.find(params).exec(
		(error, res) => {
			for (var i = 0; i < res.length; i++) {
				this.variables.server[res[i].name] = {
					src: 'MONGOOSE:SERVER',
					modified: false,
					variable: res[i]
				};
			}

			return cb();
		}
	);
};

module.exports = ExecutionContext;