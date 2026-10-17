/**
 * An object-based renderer for testing Svelte's custom renderer functionality.
 *
 * Runs in plain Node.js — no DOM required. Creates a tree of plain objects
 * with simple properties (type, name, children, attributes, value, etc).
 * Proves that Svelte can render into non-DOM targets.
 */

import { createRenderer } from '../../src/renderer/index.js';

export type ObjElement = {
	type: 'element';
	name: string;
	attributes: Record<string, string>;
	children: ObjNode[];
	elements_children: Array<HTMLElement | DocumentFragment | Text | Comment>;
	listeners: Record<string, Array<{ handler: any; options?: any }>>;
	/** Native property values for `bind:`; written by `bind().update` and by `native_change` */
	native: Record<string, unknown>;
	/** Log of programmatic writes to `native`, as `name=value` */
	native_writes: string[];
	/** Active bindings by name; `set` is the callback `bind` received */
	bound: Record<string, { set: (value: any) => void }>;
	parent: ObjNode | null;
};
type ObjText = { type: 'text'; value: string; parent: ObjNode | null };
type ObjComment = {
	type: 'comment';
	value: string;
	parent: ObjNode | null;
};
export type ObjFragment = {
	type: 'fragment';
	children: ObjNode[];
	parent: ObjNode | null;
	elements_children: Array<HTMLElement | DocumentFragment | Text | Comment>;
};
export type ObjNode = ObjElement | ObjText | ObjComment | ObjFragment;

function insert_node(
	parent: ObjNode & { children?: ObjNode[] },
	node: ObjNode,
	anchor: ObjNode | null
) {
	if (node.type === 'fragment') {
		if (parent.type === 'element' || parent.type === 'fragment') {
			parent.elements_children = node.elements_children;
		}

		const children = [...(node.children ?? [])];
		for (const child of children) {
			insert_node(parent, child, anchor);
		}
		return;
	}

	// Remove from old parent first
	if (node.parent) {
		remove_from_parent(node);
	}

	const children: ObjNode[] = parent.children ?? [];
	node.parent = parent;

	if (anchor === null) {
		children.push(node);
	} else {
		const idx = children.indexOf(anchor);
		if (idx === -1) throw new Error('Anchor not found in parent');
		children.splice(idx, 0, node);
	}
}

function remove_from_parent(node: ObjNode) {
	const parent = node.parent;
	if (!parent || !('children' in parent)) return;

	const children = parent.children;
	const idx = children.indexOf(node);
	if (idx === -1) return;

	node.parent = null;

	children.splice(idx, 1);
}

const mounted_in_dom_elements = new Map<ObjNode, DocumentFragment | Node>();

const mounted = new Map<
	HTMLElement | DocumentFragment | Text | Comment,
	ObjElement | ObjFragment
>();

function add_hidden<T extends object, P extends object>(target: T, props: P): T {
	for (const [key, value] of Object.entries(props)) {
		Object.defineProperty(target, key, { value, enumerable: false });
	}
	return target;
}

const renderer = createRenderer<{
	fragment: ObjFragment;
	element: ObjElement;
	text: ObjText;
	comment: ObjComment;
	foreign: {
		comment: Comment;
		element: HTMLElement;
		text: Text;
		fragment: DocumentFragment;
	};
}>({
	createFragment() {
		return {
			type: 'fragment',
			children: [],
			parent: null,
			elements_children: []
		};
	},

	createElement(name) {
		const element = {
			type: 'element',
			name,
			attributes: {},
			children: [],
			listeners: {},
			parent: null,
			elements_children: []
		} as ObjElement;
		// non-enumerable so that serialized trees are unchanged for tests that don't bind
		return add_hidden(element, { native: {}, native_writes: [], bound: {} });
	},

	createTextNode(data) {
		return {
			type: 'text',
			value: data,
			parent: null
		};
	},

	createComment(data) {
		return {
			type: 'comment',
			value: data,
			parent: null
		};
	},

	nodeType(node) {
		return node.type;
	},

	getNodeValue(node) {
		if (node.type === 'text' || node.type === 'comment') return node.value;
		return null;
	},

	getAttribute(element, name) {
		return element.attributes?.[name] ?? null;
	},

	setAttribute(element, key, value) {
		element.attributes[key] = String(value);
	},

	removeAttribute(element, name) {
		delete element.attributes[name];
	},

	hasAttribute(element, name) {
		return name in (element.attributes ?? {});
	},

	setText(node, text) {
		if (node.type === 'text' || node.type === 'comment') {
			node.value = text;
		}
	},

	getFirstChild(element) {
		return element.children?.[0] ?? null;
	},

	getLastChild(element) {
		const c = element.children;
		return c?.[c.length - 1] ?? null;
	},

	getNextSibling(node) {
		const parent = node.parent;
		if (!parent || !('children' in parent)) return null;
		const idx = parent.children.indexOf(node);
		return parent.children[idx + 1] ?? null;
	},

	insert(parent, element, anchor) {
		insert_node(parent, element, anchor);
	},

	remove(node) {
		remove_from_parent(node);
	},

	getParent(node) {
		return node.parent ?? null;
	},

	addEventListener(target, type, handler, options) {
		if (target.type !== 'element') return;
		if (!target.listeners) target.listeners = {};
		if (!target.listeners[type]) target.listeners[type] = [];
		target.listeners[type].push({ handler, options });
	},

	removeEventListener(target, type, handler, options) {
		if (target.type !== 'element') return;
		if (!target.listeners?.[type]) return;
		target.listeners[type] = target.listeners[type].filter(
			(/** @type {any} */ l) => l.handler !== handler
		);
	},

	bind(element, name, get, set) {
		if (element.name === 'label' && name === 'value') {
			throw new Error(`bind:${name} is not supported on <${element.name}>`);
		}

		const max = element.attributes.max === undefined ? Infinity : Number(element.attributes.max);
		const clamp = (value: any) => (typeof value === 'number' ? Math.min(value, max) : value);

		element.bound[name] = { set };

		// dimensions are read-only: the renderer reports them and never takes a state value
		if (name === 'width' || name === 'height') {
			return { destroy: () => delete element.bound[name] };
		}

		if (get() == null && element.native[name] !== undefined) {
			set(element.native[name]);
		}

		return {
			update(value) {
				const next = clamp(value);
				// echo suppression by comparison: the native side already has this value
				if (element.native[name] !== next) {
					element.native[name] = next;
					element.native_writes.push(`${name}=${next}`);
				}
				// clamped read-back: the native side holds a different value than the state
				if (next !== value) set(next);
			},
			destroy() {
				delete element.bound[name];
			}
		};
	},

	foreign: {
		insertForeign(parent, element, anchor) {
			parent.elements_children.push(element);
			mounted.set(element, parent);
		},
		removeForeign(node) {
			const parent = mounted.get(node);
			if (!parent) return;
			const idx = parent.elements_children.indexOf(node);
			if (idx !== -1) parent.elements_children.splice(idx, 1);
			mounted.delete(node);
		},
		insertIntoForeign(parent, element, anchor) {
			const custom_rendered = document.createElement('custom-rendered');
			custom_rendered.textContent = JSON.stringify(element, (key, value) => {
				if (key === 'parent') return undefined;
				return value;
			});
			parent.insertBefore(custom_rendered, anchor);
			mounted_in_dom_elements.set(element, custom_rendered);
		},
		removeFromForeign(node) {
			const custom_rendered_node = mounted_in_dom_elements.get(node);
			if (!custom_rendered_node) return;
			custom_rendered_node.parentNode?.removeChild(custom_rendered_node);
			mounted_in_dom_elements.delete(node);
		}
	}
});

// ---- Test helpers ----

/**
 * Create a root object for mounting components into.
 */
export function create_root() {
	return renderer.createFragment();
}

/**
 * Dispatch a synthetic event on an object node.
 */
export function dispatch_event(node: any, type: string, detail?: any) {
	const listeners = node.listeners?.[type];
	if (!listeners) return;
	const event = { type, detail, target: node };
	for (const { handler } of listeners) {
		handler(event);
	}
}

/**
 * Simulate the user changing a native property: stores the (clamped) value and
 * fires the native change signal at the binding.
 */
export function native_change(node: any, name: string, value: any) {
	const max = node.attributes.max === undefined ? Infinity : Number(node.attributes.max);
	node.native[name] = typeof value === 'number' ? Math.min(value, max) : value;
	node.bound[name].set(node.native[name]);
}

/**
 * Serialize an object tree to an HTML-like string for easy assertion.
 */
export function serialize(node: ObjNode): string {
	if (!node) return '';

	switch (node.type) {
		case 'text':
			return node.value ?? '';
		case 'comment':
			return '';
		case 'fragment':
			return node.children.map(serialize).join('');
		case 'element': {
			const tag = node.name;
			let attrs = '';
			const sorted_keys = Object.keys(node.attributes).sort();
			for (const key of sorted_keys) {
				attrs += ` ${key}="${node.attributes[key]}"`;
			}
			const children = node.children.map(serialize).join('');
			return `<${tag}${attrs}>${children}</${tag}>`;
		}
		default:
			return '';
	}
}

export default renderer;
