import { flushSync } from 'svelte';
import { test } from '../../test';

export default test({
	html: '<section>x</section>',
	test({ assert, component }) {
		flushSync();
		assert.equal(component.get().name, 'section');

		component.set_tag('article');
		flushSync();
		assert.equal(component.get().name, 'article');
	}
});
