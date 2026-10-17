import { flushSync } from 'svelte';
import { test } from '../../test';

export default test({
	html: '<button>a</button> <p>b</p>',
	test({ assert, target, component }) {
		flushSync();
		const button = target.children.find((/** @type {any} */ n) => n.name === 'button');
		assert.ok(button);

		// the bound value is the renderer's own node
		assert.equal(component.get(), button);
		assert.equal(component.get_plain().name, 'p');

		// {#if} teardown clears the binding
		component.toggle();
		flushSync();
		assert.equal(component.get(), null);
		assert.equal(component.get_plain(), null);

		component.toggle();
		flushSync();
		assert.equal(component.get().name, 'button');
	}
});
