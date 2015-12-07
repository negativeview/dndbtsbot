var _ = require('lodash');

function Dice(options) {
  var self = this;
  var defaults = {
    command: 'd20',
    throttles: {
      times: 100,
      repeat: 100,
      faces: 100,
      multiplier: 100,
      modifier: 100
    }
  };

  self.options = _.assign(defaults, options);

  self.data = {
    command: null,
    parsed: null,
    outcomes: [],
  };

};

// validates that any value provided is less than our throttle value
Dice.prototype.throttle = function throttle() {
  var self = this;
  var parsed = self.data.parsed;
  var throttles = self.options.throttles;

  _.forOwn(parsed, function(value, key) {
    if (value && typeof value === 'number' && _.has(throttles, key) && value > throttles[key]) {
      throw new Error(key + ' (' + value + ') exceeds the limit of ' + throttles[key] + ' that has been imposed');
    }
  });

}

// rolls the die and returns the outcome
Dice.prototype.roll = function roll(faces) {
  if (typeof faces !== 'number') {
    throw new Error('`faces` must be a number');
  }
  var min = 1;
  var max = faces;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// execute command
Dice.prototype.execute = function execute(command) {
  var self = this;
  var data = self.data;

  if (typeof command === 'undefined' || (typeof command === 'string' && !command.trim().length)) {
    command = self.options.command;
  }

  var parsed = self.parse(command);

  data.parsed = parsed;
  data.command = command;

  // throttle values provided
  self.throttle();

  _.times(data.parsed.repeat, function(n) {
    var outcome = {
      rolls: [],
      total: 0
    };

    // make the rolls
    _.times(data.parsed.times, function(n) {
      var rolled = self.roll(data.parsed.faces);
      outcome.rolls.push(rolled);
    });

    // do we need to keep a certain number of the rolls?
    if (parsed.keep) {
      outcome.original_rolls = outcome.rolls;
      switch (parsed.keepType) {
        case 0:
          outcome.rolls = _.sample(outcome.original_rolls, parsed.keep);
          break;
        case 1:
          outcome.rolls = outcome.original_rolls.sort(function(a, b) { return b - a; }).slice(0, parsed.keep);
          break;
      }
    }

    // do we need to keep the highest or lowest roll?
    if (parsed.highest) {
      var max = _.max(outcome.rolls);
      outcome.original_rolls = outcome.original_rolls || outcome.rolls;
      outcome.rolls = [ max ];
    } else if (parsed.lowest) {
      var min = _.min(outcome.rolls);
      outcome.original_rolls = outcome.original_rolls || outcome.rolls;
      outcome.rolls = [ min ];
    }

    // determine the total of the rolls without the modifier
    outcome.total = _.reduce(outcome.rolls, function(sum, roll) {
      return sum + roll;
    });

    // apply the multiplier
    if (parsed.multiplier > 1) {
      outcome.total *= parsed.multiplier;
    }

    outcome.total += parsed.modifier;

    data.outcomes.push(outcome);
  });

  var total = _.chain(data.outcomes).pluck('total')
    .reduce(function(sum, total) {
      return sum + total;
    }).value();

  return data;
}

// parses a command given in dice notation
Dice.prototype.parse = function parse(command) {
  var parsed = {};

  if (typeof command !== 'string') {
    throw new Error('Parameter `command` must be a string, not undefined');
  }

  // determine number of dice to roll
  var times = command.match(/(\d+)d/i);
  parsed.times = times && times[1] && parseInt(times[1]) || 1;

  // determine the number of faces
  var faces = command.match(/d(\d+)/i);
  parsed.faces = faces && faces[1] && parseInt(faces[1]) || 20;

  // determine the number of dice to keep
  var keep = command.match(/\(k(\d+)\)/i);
  parsed.keep = keep && keep[1] && parseInt(keep[1]) || null;
  parsed.keepType = 0;

  var extra = command.match(/\/\/(.*)/i);
  parsed.extra = extra && extra[1] || null;

  if (!keep) {
    keep = command.match(/\(kh(\d+)\)/i);
    parsed.keep = keep && keep[1] && parseInt(keep[1]) || null;
    parsed.keepType = 1;
  }

  // determine if should keep the lowest rolled dice
  var lowest = /-L/.test(command);
  parsed.lowest = lowest;
  // determine if should keep the highest rolled dice
  var highest = /-H/.test(command);
  parsed.highest = highest;

  parsed.multiplier = 1;

  // determine the modifier
  var modifier = command.match(/(\+\d+\)?|-\d+)\)?/);
  parsed.modifier = modifier && modifier[1] && parseInt(modifier[1]) || 0;

  // determine if we need to repeat at all
  var repeat = command.match(/^(\d+)x\(|\)x(\d+)$/);
  parsed.repeat = repeat && repeat[1] && parseInt(repeat[1]) || repeat && repeat[2] && parseInt(repeat[2]) || 1;

  return parsed;
}

// turns a parsed command into a command string
Dice.prototype.format = function format(parsed) {
  var self = this;
  var command = '';

  if (typeof parsed === 'undefined') {
    return self.options.command || 'd20';
  }

  // add the number of dice to be rolled
  if (parsed.times) {
    command += parsed.times;
  }

  // add the number of faces
  command += (parsed.faces) ? 'd' + parsed.faces : 'd' + 20;

  // add dice to keep command
  if (parsed.keep) {
    command += '(k' + parsed.keep + ')';
  }

  // add keep lowest command
  if (parsed.lowest) {
    command += '-L';
  }

  // add the multipier
  if (parsed.multiplier && parsed.multiplier != '1') {
    command += 'x' + parsed.multiplier;
  }

  // add the modifier
  if (parsed.modifier && parsed.modifier > 0) {
    command += '+' + parsed.modifier;
  } else if (parsed.modifier) {
    command += parsed.modifier;
  }

  // add the repeat and add command
  if (parsed.repeat) {
    command = parsed.repeat + '(' + command + ')';
  }

  return command || undefined;
}

module.exports = Dice;