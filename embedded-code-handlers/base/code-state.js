/*****
 * CodeState is basically the state of the virtual machine that the embedded
 * code runs in. It maintains three very important things.
 *
 * VARIABLES
 *     When a user executes `a = "b";`, it sets a variable in the virtual
 *     machine so that later code can reference that same variable. That itself
 *     is pretty important. Further, code in the bot itself can use CodeState
 *     to either insert variables into the virtual machine as a way of
 *     effectively passing arguments OR can read them from the CodeState as a
 *     way of getting information out of third-party code.
 * ARGS
 *     These are the numeric arguments passed to macros. They are basically a
 *     worse version of variables, but sometimes that's the only option you
 *     have.
 * STACK
 *     The stack keeps track of where you are in execution. Say that you run
 *     the macro `!a`. The stack at that point would be something like ['a'].
 *     Now !a runs `!b`. Now the stack looks like ['a', 'b']. If `!b` gets done
 *     executing, the stack becomes ['a'] again.
 *
 *     By keeping track of things in this way, we can implement a rule: you
 *     cannot enter a context that you are already inside. So not only can `!a`
 *     not call `!a`, nothing that `!a` calls directly, or indirectly, can also
 *     call `!a`. This should be a safe way to implement macros being able to
 *     call other macros without the world blowing up.
 *****/
function CodeState() {
	this.variables = {};
	this.args = [];
	this.stack = [];
}

CodeState.prototype.addVariables = function(dictionary) {
	var keys = Object.keys(dictionary);
	for (var i = 0; i < keys.length; i++) {
		this.variables[keys[i]] = dictionary[keys[i]];
	}
}

CodeState.prototype.setArguments = function(arguments) {
	this.args = arguments;
}

module.exports = CodeState;