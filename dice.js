var _ = require('lodash');
var lexer = require('lex');

function Dice(options) {
  var self = this;
  var defaults = {
    command: 'd20',
  };

  self.options = _.assign(defaults, options);

  self.data = {
    command: null,
    parsed: null,
    outcomes: [],
  };
}

function doDiceRolling(tokens, self, cb) {
  // Handle the actual rolling.
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    switch (token.type) {
      case 'die':
        var parsed = self.parse(token.lexeme);
        if (token.keep) {
          parsed.keep = token.keep;
        }
        if (token.advantage) {
          parsed.highest = true;
        }
        if (token.disadvantage) {
          parsed.lowest = true;
        }

        tokens[i].results = [];
        tokens[i].parsed = parsed;
        for (var p = 0; p < parsed.times; p++) {
          tokens[i].results.push(self.roll(parsed.faces));
        }
        tokens[i].results.sort(function(a, b) {
          return a - b;
        });
        break;
    }
  }

  cb(tokens);
}

function createNumberEquivalents(tokens, cb) {
  // Modifiers to those rolls.
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    switch (token.type) {
      case 'number':
        token.number = token.lexeme;
        break;
      case 'die':
        if (token.advantage) {
          tokens[i].number = token.results[token.results.length-1];
          tokens[i].kept = [tokens[i].number];
          tokens[i].dropped = [];
          for (var p = 0; p < token.results.length; p++) {
            if (p != token.results.length - 1) {
              tokens[i].dropped.push(token.results[p]);
            }
          }
        } else if (token.disadvantage) {
          tokens[i].number = token.results[0];          
          tokens[i].kept = [token.results[0]];
          tokens[i].dropped = [];
          for (var p = 1; p < token.results.length; p++) {
            tokens[i].dropped.push(token.results[p]);
          }
        } else if (token.keep) {
          tokens[i].number = 0;
          tokens[i].kept = [];
          tokens[i].dropped = [];

          for (var p = 0; p < token.results.length - token.keep; p++) {
            tokens[i].dropped.push(token.results[p]);
          }
          for (var p = token.results.length - token.keep; p < token.results.length; p++) {
            tokens[i].number += token.results[p];
            tokens[i].kept.push(token.results[p]);
          }
        } else {
          tokens[i].number = 0;
          for (var p = 0; p < token.results.length; p++) {
            tokens[i].number += token.results[p];
          }
        }
        break;
    }
  }

  cb(tokens);
}

function doMath(tokens, cb) {
  var result = parseInt(tokens[0].number);
  for (var i = 1; i < tokens.length; i++) {
    var token = tokens[i];
    switch (token.type) {
      case '+':
        result += parseInt(tokens[i+1].number);
        i++;
        break;
      case '-':
        result -= parseInt(tokens[i+1].number);
        i++;
        break;
    }
  }

  cb(result);
}

function applyModifiers(tokens, cb) {
  // Put modifiers to a die roll into the actual die token.
  var lastDie = -1;
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    switch (token.type) {
      case 'die':
        lastDie = i;
        break;
      case 'advantage':
        if (lastDie == -1) {
          throw 'Cannot set advantage without a die roll.';
        }
        tokens[lastDie].advantage = true;
        break;
      case 'disadvantage':
        if (lastDie == -1) {
          throw 'Cannot set disadvantage without a die roll.';
        }
        tokens[lastDie].disadvantage = true;
        break;
      case 'keep-high':
        if (lastDie == -1) {
          throw 'Cannot set keep-high without a die roll.';
        }

        var matches = token.lexeme.match(/kh(\d+)/);
        tokens[lastDie].keep = matches[1];
        break;
    }
  }

  // Copy tokens that are still relevant.
  var newTokens = [];
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    switch (token.type) {
      case 'number':
      case 'die':
      case '+':
      case '-':
      case 'variable':
        newTokens.push(token);
        break;
    }
  }

  return cb(newTokens);
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
Dice.prototype.execute = function execute(command, callback) {
  var lex = new lexer();

  var tokens = [];
  var isSimple = false;
  var isPlain = false;

  lex.addRule(/\+\-/, function (lexeme) {
    tokens.push({
      type: '-',
      lexeme: '-'
    });
  });
  lex.addRule(/\-/, function(lexeme) {
    tokens.push({
      type: '-',
      lexeme: lexeme
    });
  });
  lex.addRule(/-?(\d+)d(\d+)/, function(lexeme) {
    tokens.push({
      type: 'die',
      lexeme: lexeme
    });
  });
  lex.addRule(/\<([^\>]+)\>/, function(lexeme) {
    tokens.push({
      type: 'variable',
      lexeme: lexeme
    });
  });
  lex.addRule(/\-H/, function(lexeme) {
    tokens.push({
      type: 'advantage',
      lexeme: lexeme
    });
  });
  lex.addRule(/simple/, function(lexeme) {
    isSimple = true;
  });
  lex.addRule(/plain/, function(lexeme) {
    isPlain = true;
  });
  lex.addRule(/kh(\d+)/, function(lexeme) {
    tokens.push({
      type: 'keep-high',
      lexeme: lexeme
    });
  });
  lex.addRule(/[\(\)]/, function(lexeme) {
  });
  lex.addRule(/\-L/, function(lexeme) {
    tokens.push({
      type: 'disadvantage',
      lexeme: lexeme
    });
  });
  lex.addRule(/\+/, function(lexeme) {
    tokens.push({
      type: '+',
      lexeme: lexeme
    });
  });
  lex.addRule(/(\d+)/, function(lexeme) {
    tokens.push({
      type: 'number',
      lexeme: lexeme
    });
  });
  lex.setInput(command);

  try {
    lex.lex();
  } catch (e) {
    return {
      command: command,
      output: command + '::' + e
    };
  }

  var self = this;
  var cb = callback;

  applyModifiers(tokens, function(tokens) {
    doDiceRolling(tokens, self, function(tokens) {
      createNumberEquivalents(tokens, function(tokens) {
        doMath(tokens, function(result) {
          var data = {
            command: command,
            output: ''
          };

          if (isPlain) {
            data.output = result;
          } else if (isSimple) {
            data.output = '`' + result + '`';
          } else {
            for (var i = 0; i < tokens.length; i++) {
              if (data.output != '')
                data.output += ' ';
              data.output += tokens[i].lexeme;

              if (tokens[i].results) {
                data.output += ' (';
                if (tokens[i].kept) {
                  data.output += '~~';
                  data.output += tokens[i].dropped.join(', ');
                  data.output += '~~';
                  data.output += ', ';

                  for (var p = 0; p < tokens[i].kept.length; p++) {
                    if (p != 0)
                      data.output += ', ';
                    var value = tokens[i].kept[p];
                    if (value == 1 || value == tokens[i].parsed.faces) {
                      data.output += '**' + value + '**';
                    } else {
                      data.output += value;
                    }
                  }
                } else {
                  for (var p = 0; p < tokens[i].results.length; p++) {
                    if (p != 0)
                      data.output += ', ';
                    var value = tokens[i].results[p];
                    if (value == 1 || value == tokens[i].parsed.faces) {
                      data.output += '**' + value + '**';
                    } else {
                      data.output += value;
                    }
                  }
                }
                data.output += ')';
              }
            }
            data.output += ' = `' + result + '`';
          }
          return cb(data);
        });
      });
    });
  });
}

// parses a command given in dice notation
Dice.prototype.parse = function parse(command) {
  var parsed = {};

  if (typeof command !== 'string') {
    throw new Error('Parameter `command` must be a string, not undefined');
  }

  var pieces = command.split(/[-+\*]/);

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