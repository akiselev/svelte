import { flushSync } from 'svelte';
import { test } from '../../test';

export default test({
	compileOptions: { hmr: true },
	html: '<button>a</button>',
	test({ assert, target, component }) {
		flushSync();
		const button = target.children.find((/** @type {any} */ n) => n.name === 'button');
		assert.equal(component.get(), button);
	}
});
