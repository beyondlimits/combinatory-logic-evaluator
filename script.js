'use strict';

!function(){
	var evaluationArea = document.getElementById('evaluationArea');
	var form = document.getElementById('form');
	var input = document.getElementById('input');
	var stepTemplate = document.getElementById('stepTemplate');

	var rulePriority = [
		// produce less terms than consume
		'I', 'K',

		// only swap terms around
		'B', 'C', 'T', 'V',

		// produce little more terms than consume
		'i',

		// possibly explosive (may produce a lot of terms)
		'S', 'A', 'W', 'Y', 'U', 'M', 'ω', 'Ω'
	];

	// rules of substitution
	var rules = {
		I: ['x', 'x'],         // Identity
		K: ['xy', 'x'],        // Kestrel
		S: ['xyz', 'xz(yz)'],  // Starling
		A: ['xyz', 'xy(xz)'],  // my own bird
		i: ['x', 'xSK'],       // Iota
		B: ['xyz', 'x(yz)'],   // Bluebird
		C: ['xyz', 'xzy'],     // Cardinal
		T: ['xy', 'yx'],       // Thrush
		V: ['xyz', 'zxy'],     // Vireo
		W: ['xy', 'xyy'],      // Warbler
		Y: ['x', 'x(Yx)'],     // Sage
		U: ['xy', 'y(xxy)'],   // Turing
		M: ['x', 'xx'],        // Mockingbird
		ω: ['x', 'xx'],        // alias of Mockingbird
		Ω: ['', 'ωω']          // Omega
	};

	// convert rules so that we can evaluate them with priority
	for (var k in rules) {
		var r = {}
		r[k] = rules[k];
		rules[k] = r;
	}

	stepTemplate.remove();
	stepTemplate.removeAttribute('id');
	stepTemplate.classList.remove('template');

	form.addEventListener('input', evaluate);

	function evaluate() {
		evaluationArea.innerHTML = '';

		try {
			var term = CL.parse(input.value);
		} catch (e) {
			addStep(e.message, 'error');
			return;
		}

		var s = CL.stringify(term);
		var nodes = {};
		nodes[s] = addStep(s);

		for(var i = 0; i < 9999; i++) {
			var sOld = s;
			try {
				var rule = evaluateRules(term);
				s = CL.stringify(term);
			} catch (e) {
				addStep(e.message, 'error');
				break;
			}

			if (s == sOld) {
				break;
			}

			var node = addStep(s);

			if (nodes[s]) {
				nodes[s].classList.add('repetition');
				node.classList.add('repetition');
				break;
			}

			if (s.length > 10000) {
				// term became way too long
				addStep('*** BOOM! ***', 'error');
				break;
			}

			nodes[s] = node;
		}
	}

	function evaluateRules(term) {
		for (var i = 0, n = rulePriority.length; i < n; ++i) {
			var k = rulePriority[i];
			if (CL.evaluate(term, rules[k], 1)) {
				return k;
			}
		}
	}

	function addStep(s, classes) {
		var node = stepTemplate.cloneNode();

		node.innerText = s;

		if (classes) {
			if (typeof classes == 'string') {
				node.classList.add(classes);
			} else if (classes instanceof Array) {
				for (var i = 0, n = c.length; i < n; i++) {
					node.classList.add(classes[i]);
				}
			}
		}

		evaluationArea.appendChild(node);

		return node;
	}
}();
