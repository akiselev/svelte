import { flushSync } from 'svelte';
import { test } from '../../test';

export default test({
	html: '<box></box> <p>0</p>',
	test({ assert, target, serialize, native_change }) {
		const box = target.children.find((/** @type {any} */ n) => n.name === 'box');
		assert.ok(box);

		native_change(box, 'width', 40);
		flushSync();
		assert.equal(serialize(target), '<box></box> <p>40</p>');

		// the state is never written to the native side
		assert.deepEqual(box.native_writes, []);
	}
});
