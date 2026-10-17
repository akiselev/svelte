/** @import { RendererBinding } from '../../../custom-renderer/types.js' */
import { render_effect, teardown } from '../../../reactivity/effects.js';
import { tick, untrack } from '../../../runtime.js';
import { current_renderer } from '../../../custom-renderer/state.js';
import { without_reactive_context } from './shared.js';
import * as e from '../../../errors.js';

/**
 * Delegates `bind:<name>` on an element to `renderer.bind`. The renderer reports native
 * changes through `set`, and Svelte reports state changes through `binding.update`.
 * @param {object} element
 * @param {string} name
 * @param {() => unknown} get
 * @param {(value: unknown) => void} set
 * @returns {void}
 */
export function bind_renderer(element, name, get, set = get) {
	if (current_renderer === null || current_renderer.bind === undefined) {
		e.bind_unsupported_by_renderer(name);
	}

	var destroyed = false;

	/** @type {RendererBinding | void} */
	var binding = current_renderer.bind(
		element,
		name,
		() => untrack(get),
		(value) => {
			without_reactive_context(() => set(value));

			// Respect any validation in accessors: if the setter did not take the
			// value, the native side has to be told what the state actually is
			tick().then(() => {
				if (destroyed) return;
				var current = untrack(get);
				if (current !== value) binding?.update?.(current);
			});
		}
	);

	if (!binding) return;

	if (binding.update) {
		render_effect(() => {
			var value = get();
			untrack(() => /** @type {RendererBinding} */ (binding).update?.(value));
		});
	}

	teardown(() => {
		destroyed = true;
		/** @type {RendererBinding} */ (binding).destroy?.();
	});
}
