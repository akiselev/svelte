import { flushSync } from 'svelte';
import { test } from '../../test';

export default test({
	html: '<spin max="10"></spin> <p>1</p>',
	test({ assert, target, serialize, native_change, component }) {
		const spin = target.children.find((/** @type {any} */ n) => n.name === 'spin');
		assert.ok(spin);

		// programmatic set beyond the maximum: the native side clamps and the state follows
		component.set(50);
		flushSync();
		assert.equal(spin.native.value, 10);
		assert.equal(component.get(), 10);
		assert.equal(serialize(target), '<spin max="10"></spin> <p>10</p>');

		// native change beyond the maximum is clamped by the native side
		native_change(spin, 'value', 99);
		flushSync();
		assert.equal(component.get(), 10);

		native_change(spin, 'value', 4);
		flushSync();
		assert.equal(serialize(target), '<spin max="10"></spin> <p>4</p>');
	}
});
