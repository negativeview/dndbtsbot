var async = require('async');

var ret = {};

ret.init = function(mongoose, bot) {
	ret.mongoose = mongoose;
	ret.bot = bot;

	var Schema = mongoose.Schema;

	var WordSchema = new Schema({
		word: String
	});
	mongoose.model('MarkovWord', WordSchema);
	ret.wordModel = mongoose.model('MarkovWord');

	var WordNextSchema = new Schema({
		word_a: String,
		word_b: String,
		word_c: String,
		count: Number
	});
	mongoose.model('MarkovWordNext', WordNextSchema);
	ret.wordNextModel = mongoose.model('MarkovWordNext');
};

ret.parse = function(message) {
	var words = [];
	var index = 0;

	async.eachSeries(
		message,
		function(iterator_a, callback_a) {
			var params = {
				word: iterator_a.toLowerCase()
			};
			ret.wordModel.find(params).exec(
				function(err, res) {
					if (err) throw err;

					if (res.length) {
						words.push(res[0]);
						return callback_a();
					} else {
						var model = new ret.wordModel(params);
						model.save(function(res2) {
							ret.wordModel.find(params).exec(
								function(err, res) {
									if (err) throw err;
									if (res.length) {
										words.push(res[0]);
									} else {
										throw "Should never get here.";
									}
									return callback_a();
								}
							);
						});
					}
				}
			);
		},
		function() {
			async.eachSeries(
				words,
				function(iterator_b, callback_b) {
					var word = words[index];

					if (index > words.length) return callback_b();

					var table = [];
					table.push(words[index]);
					table.push(words[index+1]);
					table.push(words[index+2]);

					var params = {
						word_a: words[index] ? words[index]._id : null,
						word_b: words[index + 1] ? words[index + 1]._id : null,
						word_c: words[index + 2] ? words[index + 2]._id : null
					};

					ret.wordNextModel.find(params).exec(
						function(err, res) {
							if (err) throw err;

							if (res.length == 0) {
								params.count = 1;
								var model = new ret.wordNextModel(params);
								model.save(function(err) {
									if (err) throw err;
									index++;
									return callback_b();
								});
							} else {
								res[0].count = res[0].count + 1;
								res[0].save(function(err) {
									if (err) throw err;
									index++;
									return callback_b();
								});
							}
						}
					);
				}, function() {
					console.log('done');
					console.log(words);
				}
			);
		}
	);
};

module.exports = ret;