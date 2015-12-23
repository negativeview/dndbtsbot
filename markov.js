var async = require('async');

var ret = {};

ret.init = function(mongoose, bot) {
	ret.mongoose = mongoose;
	ret.bot = bot;

	var Schema = mongoose.Schema;

	var WordSchema = new Schema({
		word: String,
		times: Number,
		previous: [
			{
				word: String,
				times: Number
			}
		],
		next: [
			{
				word: String,
				times: Number
			}
		]
	});
	mongoose.model('MarkovWord', WordSchema);
	ret.wordModel = mongoose.model('MarkovWord');
};

function startReplyChain(err, res, stateHolder) {
	if (err) throw err;
	if (res.length == 0) return;

	res.sort(
		function(a, b) {
			if (a.times < b.times) return -1;
			if (b.times < a.times) return 1;
			return 0;
		}
	);

	var totalSize = res.length;
	var toBuildFrom = Math.floor(totalSize / 10);
	if (toBuildFrom < 3) toBuildFrom = 3;
	if (toBuildFrom > res.length) toBuildFrom = res.length;

	var arrayOfChoices = [];
	for (var i = 0; i < toBuildFrom; i++) {
		arrayOfChoices.push(res[i]);
	}

	var theReply = [];
	var chosenWord = Math.floor(Math.random() * (toBuildFrom + 1));
	chosenWord = arrayOfChoices[chosenWord];

	theReply.push(chosenWord);

	async.forever(
		function(next) {
			var idx = theReply.length-1;
			var currentFirstWord = theReply[idx];
			if (!currentFirstWord) return next('non-error');

			var potentials = currentFirstWord.previous;
			if (!potentials || potentials.length == 0) return next('non-error');

			var chosen = potentials[Math.floor(Math.random() * potentials.length)];

			if (chosen.word == null) return next('non-error');

			ret.wordModel.find({word: chosen.word}).exec(function(err2, res2) {
				if (err2) throw err2;

				if (res2.length == 0) return next();

				theReply.push(res2[0]);

				return next();
			});
		},
		function(err) {
			theReply.reverse();
			async.forever(
				function(next2) {
					var idx = theReply.length-1;
					var currentFirstWord = theReply[idx];
					if (!currentFirstWord) return next2('non-error');

					var potentials = currentFirstWord.next;
					if (!potentials || potentials.length == 0) return next2('non-error');

					var chosen = potentials[Math.floor(Math.random() * potentials.length)];

					if (chosen.word == null) return next2('non-error');

					ret.wordModel.find({word: chosen.word}).exec(function(err2, res2) {
						if (err2) throw err2;

						if (res2.length == 0) return next2();

						theReply.push(res2[0]);

						return next2();
					});
				},
				function(err2) {
					var reply = '';

					for (var i = 0; i < theReply.length; i++) {
						if (!theReply[i]) break;
						if (i != '') reply += ' ';
						reply += theReply[i].word;
					}

					console.log(reply);
					//stateHolder.simpleAddMessage(stateHolder.channelID, reply);
					//stateHolder.doFinalOutput();
				}
			)
		}
	);
}

ret.replyTo = function(message, stateHolder) {
	ret.wordModel.find()
		.where('word')
		.in(message)
		.exec(
			function(err, res) {
				startReplyChain(err, res, stateHolder);
			}
		);
};

function setupModel(res, params, previous) {
	var model;
	if (res.length == 0) {
		params.times = 1;
		model = new ret.wordModel(params);
	} else {
		model = res[0];
		model.times++;
	}

	var foundPrevious = false;
	if (previous) {
		if (model.previous) {
			for (var i = 0; i < model.previous.length; i++) {
				if (model.previous[i].word == previous.word) {
					model.previous[i].times++;
					foundPrevious = true;
					break;
				}
			}
		} else {
			model.previous = [];
			model.previous.push({word: previous.word, times: 1});
		}
	} else {
		if (!(model.previous))
			model.previous = [];

		model.previous.push({
			word: null,
			times: 1
		});
		foundPrevious = true;
	}

	if (!foundPrevious) {
		if (previous) {
			model.previous.push({word: previous.word, times: 1});
		}
	}
	return model;
}

ret.parse = function(message, stateHolder) {
	var words = [];
	var index = 0;

	var previous = null;

	ret.replyTo(message, stateHolder);

	async.eachSeries(
		message,
		function(iterator_a, callback_a) {
			var params = {word: iterator_a};

			ret.wordModel.find(params).exec(
				function(err, res) {
					if (err) throw err;

					var model = setupModel(res, params, previous);

					if (previous) {
						var p = previous;
						previous = model;

						var foundNext = false;
						for (var i = 0; i < p.next.length; i++) {
							if (p.next[i].word == model.word) {
								foundNext = true;
								p.next[i].times++;
								break;
							}
						}
						if (!foundNext) {
							p.next.push({word: model.word, times: 1});
						}

						p.save(function(err) {
							if (err) throw err;

							return callback_a();
						});
					} else {
						var foundPrevious = false;
						for (var i = 0; i < model.previous.length; i++) {
							if (!model.previous[i].word) {
								foundPrevious = true;
								break;
							}
						}
						if (!foundPrevious) {
							model.previous.push({
								word: null,
								times: 1
							});
						}
						previous = model;
						return callback_a();
					}
				}
			);
		},
		function() {
			previous.save(function(err) {
				if (err) throw err;
			});
		}
	);
};

module.exports = ret;