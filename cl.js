'use strict';

var CL = function(undefined){
	var isArray = Array.isArray;
	var splice = Array.prototype.splice;

	// Copy term recursively.
	function copy(a) {
		return isArray(a) ? a.map(copy) : a;
	}

	// Rewrite term using rule. Always drops the first subterm.
	//   Example: a = ['K', 'a', 'b', 'c'], from = 'xy', to = 'x'
	//   a becumes ['a', 'c'] after rewrite.
	function rewrite(a, from, to) {
		var n = from.length;

		if (n >= a.length) {
			// pattern is too large and won't match
			return false;
		}


		var captured = {}; // variables matched with subterms
		var used = {};     // to avoid referencing array more than one time

		for (var i = 0; i < n; ++i) {
			var c = from[i];

			if (captured.hasOwnProperty(c)) {
				throw new TypeException('Pattern ' + from + ' contains repeated characters.');
			}

			captured[c] = a[i+1];
		}

		var b = [0, n + 1]; // prepopulated for splice.apply
		var stack = [];
		var current = b;

		n = to.length;

		for (var i = 0; i < n; ++i) {
			var c = to[i];

			switch (c) {
				case '(':
					stack.push(current);
					current = [];
					break;

				case ')':
					if (!stack.length) {
						throw new TypeError('Unbalanced parentheses');
					}

					var temp = stack.pop();
					temp.push(current);
					current = temp;
					break;

				case ' ':
					break;

				default:
					if (used.hasOwnProperty(c)) {
						// this array was already used - must be copied
						current.push(copy(captured[c]));
					} else if (captured.hasOwnProperty(c)) {
						current.push(captured[c]);
						used[c] = undefined;
					} else {
						// unknown combinator, leave as is.
						current.push(c);
					}
			}
		}

		if (current != b) {
			throw new TypeError('Unbalanced parentheses');
		}

		splice.apply(a, b);

		return true;
	}

	// Parses the term (string) into equivalent array representation.
	// Example: 'S(KS)K' is converted to ['S', ['K', 'S'], 'K'].
	function parse(s) {
		if (typeof s != 'string') {
			throw new TypeError('Term must be a string');
		}

		var result = [];
		var stack = [];
		var current = result;

		for (var i = 0, n = s.length; i < n; ++i) {
			switch (s[i]) {
				case '(':
					stack.push(current);
					current = [];
					break;

				case ')':
					if (!stack.length) {
						throw new TypeError('Unbalanced parentheses');
					}

					var temp = stack.pop();
					temp.push(current);
					current = temp;
					break;

				case ' ':
					break;

				default:
					current.push(s[i]);
			}
		}

		if (current != result) {
			throw new TypeError('Unbalanced parentheses');
		}

		return result;
	}

	// Converts the term (array) to string.
	// Example: ['S', ['K', 'S'], 'K'] is converted to 'S(KS)K'.
	function stringify(a) {
		var result = '';

		for (var i = 0, n = a.length; i < n; ++i) {
			result += isArray(a[i]) ? '(' + stringify(a[i]) + ')' : a[i];
		}

		return result;
	}

	// Drops parentheses from the first subterm.
	// Example: Given a = [['S', 'K'], ['K', 'K']],
	// a becomes ['S', 'K', ['K', 'K']] after drop.
	function dropParentheses(a, count) {
		var result = 0;

		while (result < count && isArray(a[0])) {
			var b = [0, 1].concat(a[0]);
			splice.apply(a, b);
			++result;
		}

		return result;
	}

	// Evaluate the term using rules.
	function evaluate(a, rules, count) {
		var result = dropParentheses(a, count);

		if (result) {
			return result;
		}

		if (typeof count == 'undefined') {
			count = 1 / 0;
		}

		var result = 0;

		for (var i = 0, n = a.length; i < n && result < count; ++i) {
			if (isArray(a[i])) {
				result += evaluate(a[i], rules, count - result);

				// to drop parentheses around single combinators
				if (a[i].length == 1) {
					a[i] = a[i][0];
				}
			}
		}

		if (result < count && !isArray(a[0]) && rules.hasOwnProperty(a[0])) {
			var rule = rules[a[0]];
			if (rewrite(a, rule[0], rule[1])) {
				++result;
			}
		}

		return result;
	}

	return {
		copy: copy,
		dropParentheses: dropParentheses,
		evaluate: evaluate,
		parse: parse,
		rewrite: rewrite,
		stringify: stringify
	}
}();

