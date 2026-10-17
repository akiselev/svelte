import { flushSync, tick } from 'svelte';
import { test } from '../../test';

export default test({
	html: '<entry></entry> <p>x</p>',
	async test({ assert, target, serialize, native_change, component }) {
		const entry = target.children.find((/** @type {any} */ n) => n.name === 'entry');
		assert.ok(entry);
		assert.equal(entry.native.value, 'x');

		// the setter transforms the value, so the native side is told what the state holds
		native_change(entry, 'value', 'abc');
		flushSync();
		await tick();
		assert.equal(component.get(), 'ABC');
		assert.equal(serialize(target), '<entry></entry> <p>ABC</p>');
		assert.equal(entry.native.value, 'ABC');
	}
});
