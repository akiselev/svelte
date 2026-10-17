import { assert, describe, it } from 'vitest';
import { compile } from 'svelte/compiler';
import * as $ from 'svelte/internal/client';

const enabled = { generate: 'client', experimental: { customRenderer: 'my-renderer' } } as const;

describe('element bindings with a custom renderer', () => {
	for (const name of ['this', 'value', 'text', 'checked', 'width', 'anything', 'paused', 'files']) {
		it(`accepts bind:${name}`, () => {
			const { js } = compile(
				`<script>let x = $state();</script><entry bind:${name}={x} />`,
				enabled
			);
			assert.include(
				js.code,
				name === 'this' ? '$.bind_this(' : `$.bind_renderer(entry, '${name}'`
			);
		});
	}

	it('accepts function bindings', () => {
		const { js } = compile('<entry bind:value={() => 1, (v) => {}} />', enabled);
		assert.include(js.code, "$.bind_renderer(entry, 'value'");
	});

	it('accepts bindings on <svelte:element>', () => {
		assert.doesNotThrow(() =>
			compile(
				'<script>let v = $state();</script><svelte:element this="x" bind:value={v} />',
				enabled
			)
		);
	});

	it('rejects bind:group', () => {
		assert.throws(
			() => compile('<entry value="a" bind:group={g} />', enabled),
			/`bind:group` is not compatible with `customRenderer`/
		);
	});

	for (const target of ['window', 'document', 'body']) {
		it(`rejects bindings on <svelte:${target}>`, () => {
			assert.throws(
				() => compile(`<svelte:${target} bind:online={x} />`, enabled),
				/incompatible_with_custom_renderer/
			);
		});
	}

	it('keeps DOM validation in a component that opts out of the renderer', () => {
		assert.throws(
			() => compile('<svelte:options customRenderer={null} /><entry bind:value={x} />', enabled),
			/bind_invalid_name|bind_invalid_target/
		);
		assert.throws(
			() => compile('<svelte:options customRenderer={null} /><div bind:value={x}></div>', enabled),
			/bind_invalid_target/
		);
	});

	it('throws at runtime when the renderer has no bind method', () => {
		const pop = $.push_renderer({} as any);
		try {
			assert.throws(() => $.bind_renderer({}, 'value', () => 1), /does not support `bind:value`/);
		} finally {
			pop();
		}
	});
});
