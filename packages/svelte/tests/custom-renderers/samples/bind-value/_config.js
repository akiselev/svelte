import { flushSync } from 'svelte';
import { test } from '../../test';

export default test({
	html: '<entry></entry> <p>a</p>',
	test({ assert, target, serialize, native_change, component }) {
		const entry = target.children.find((/** @type {any} */ n) => n.name === 'entry');
		assert.ok(entry);

		// initial state is written to the native side
		assert.equal(entry.native.value, 'a');
		assert.deepEqual(entry.native_writes, ['value=a']);

		// native -> state; the echo does not write back to the native side
		native_change(entry, 'value', 'b');
		flushSync();
		assert.equal(component.get(), 'b');
		assert.equal(serialize(target), '<entry></entry> <p>b</p>');
		assert.deepEqual(entry.native_writes, ['value=a']);

		// state -> native
		component.set('c');
		flushSync();
		assert.equal(entry.native.value, 'c');
		assert.deepEqual(entry.native_writes, ['value=a', 'value=c']);
	}
});
