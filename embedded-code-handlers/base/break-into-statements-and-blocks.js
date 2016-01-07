/**
 * To implement control flow statements, we need a concept of "blocks" of code.
 * This is what makes those block tokens.
 */

module.exports = function (tokens) {
	while (true) {
		var createdBlock = false;
		var blockStartIndex = 0;
		var inBlock = false;

		for (var i = 0; i < tokens.length; i++) {
			var token = tokens[i];
			if (token.type == 'LEFT_CURLY') {
				blockStartIndex = i;
				inBlock = true;
			}
			if (token.type == 'RIGHT_CURLY') {
				if (inBlock) {
					createdBlock = true;
					break;
				}
			}
		}

		if (createdBlock) {
			var endLocation = i;
			var tmpTokens = [];
			for (var i = 0; i < blockStartIndex; i++) {
				tmpTokens.push(tokens[i]);
			}

			var blockContents = [];
			for (var i = blockStartIndex + 1; i < endLocation; i++) {
				blockContents.push(tokens[i]);
			}

			var blockToken = {
				type: 'BLOCK',
				rawValue: '...',
				internal: blockContents
			};
			tmpTokens.push(blockToken);

			for (var i = endLocation + 1; i < tokens.length; i++) {
				tmpTokens.push(tokens[i]);
			}
			tokens = tmpTokens;
		} else {
			break;
		}
	}

	return tokens;
}