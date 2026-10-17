import { flushSync } from 'svelte';
import { test } from '../../test';

export default test({
	test({ assert, target, component }) {
		flushSync();
		const ul = target.children.find((/** @type {any} */ n) => n.name === 'ul');
		assert.ok(ul);
		const lis = () => ul.children.filter((/** @type {any} */ n) => n.name === 'li');

		const by_id = component.get_by_id();
		assert.equal(lis().length, 6);
		assert.equal(by_id[1].children[0].value, '1');
		assert.equal(by_id[3].children[0].value, '3');

		const node_2 = by_id[2];

		// keyed: reordering moves the nodes, the bindings keep following their key
		component.reverse();
		flushSync();
		assert.equal(by_id[2], node_2);
		assert.equal(lis()[1], node_2);

		// keyed: removing an item nulls its binding and leaves the others alone
		component.remove(2);
		flushSync();
		assert.equal(by_id[2], null);
		assert.equal(by_id[1].children[0].value, '1');
		assert.equal(by_id[3].children[0].value, '3');

		// unkeyed: the binding at the removed trailing index is cleared
		const els = component.get_els();
		assert.equal(els[2], null);
		assert.equal(els[0].children[0].value, '3');
		assert.equal(els[1].children[0].value, '1');
	}
});
