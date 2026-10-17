export type Renderer<
	TFragment extends object = object,
	TElement extends object = object,
	TTextNode extends object = object,
	TComment extends object = object,
	TForeignNodes extends RendererNodes<any, any, any, any, any> | undefined = RendererNodes<
		any,
		any,
		any,
		any,
		any
	>,
	TNode extends TFragment | TElement | TTextNode | TComment =
		| TFragment
		| TElement
		| TTextNode
		| TComment
> = {
	/** Creates a fragment, a container for multiple nodes. Inserting a fragment should insert all of its children. */
	createFragment(): TFragment;

	/** Creates an element with the given name. */
	createElement(name: string): TElement;

	/** Creates a text node with the given data. */
	createTextNode(data: string): TTextNode;

	/**
	 * Creates a comment node with the given data.
	 * This is often used as an anchor for inserting elements; it doesn't necessarily need to be rendered.
	 */
	createComment(data: string): TComment;

	/** Should return the type of the node in string form. */
	nodeType(node: TNode): NodeType;

	/**
	 * Return the value of the node:
	 * - text value of a text node
	 * - data value of a comment
	 * - null for elements and fragments
	 */
	getNodeValue(node: TTextNode | TComment): string | null;

	/** Return the value of the attribute with the given name on the element, or null if it doesn't exist. */
	getAttribute(element: TElement, name: string): string | null;

	/** Set the attribute with the given name and value on the element. */
	setAttribute(element: TElement, key: string, value: any): void;

	/** Remove the attribute with the given name from the element. */
	removeAttribute(element: TElement, name: string): void;

	/** Return true if the element has an attribute with the given name. */
	hasAttribute(element: TElement, name: string): boolean;

	/**
	 * Set the text content of the node to the given value.
	 * This should work for both text nodes and elements.
	 */
	setText(node: TElement | TTextNode | TComment, text: string): void;

	/** Return the first child of the element or fragment, or null if it has no children. */
	getFirstChild(element: TElement | TFragment): TNode | null;

	/** Return the last child of the element or fragment, or null if it has no children. */
	getLastChild(element: TElement | TFragment): TNode | null;

	/** Return the next sibling of the node, or null if it has no next sibling. */
	getNextSibling(node: TElement | TTextNode | TComment): TNode | null;

	/**
	 * Insert the element into the parent before the anchor.
	 * If anchor is null, insert at the end.
	 */
	insert(
		parent: TElement | TFragment,
		element: TNode,
		anchor: TElement | TTextNode | TComment | null
	): void;

	/** Remove the node from the tree. */
	remove(node: TElement | TTextNode | TComment): void;

	/** Return the parent of the element, or null if it has no parent. */
	getParent(element: TElement | TTextNode | TComment): TNode | null;

	/** Add an event listener of the given type and handler to the target node. */
	addEventListener(target: TElement, type: string, handler: any, options?: any): void;

	/** Remove an event listener of the given type and handler from the target node. */
	removeEventListener(target: TElement, type: string, handler: any, options?: any): void;

	/**
	 * Called for `bind:<name>` on an element, for any `name` except `this` and `group`.
	 * The renderer decides what the binding means for the element, subscribes to the native
	 * change and calls `set(value)` with the (normalized) native value. `get` reads the current
	 * state value without tracking it. Throw to reject a binding the element does not support.
	 *
	 * If the returned object has `update`, it is called with the state value once initially,
	 * then every time the state changes (always synchronously from a render effect, never from
	 * within `set`), and also after a `set` whose value the state did not take (rejected or
	 * transformed by a function binding). `destroy` is called when the element's binding
	 * is torn down.
	 *
	 * Read-only bindings (such as dimensions) only call `set` and omit `update`.
	 */
	bind?(
		element: TElement,
		name: string,
		get: () => any,
		set: (value: any) => void
	): RendererBinding | void;

	/** Operations used when this renderer is interleaved with DOM or another custom renderer. */
	foreign?: {
		/**
		 * Insert a node from this renderer into a different renderer's parent before the anchor.
		 * If anchor is null, insert at the end.
		 */
		insertIntoForeign(
			parent: TForeignNodes extends undefined
				? never
				:
						| DefinedRendererNodes<TForeignNodes>['element']
						| DefinedRendererNodes<TForeignNodes>['fragment'],
			element: TNode,
			anchor:
				| DefinedRendererNodes<TForeignNodes>['element']
				| DefinedRendererNodes<TForeignNodes>['text']
				| DefinedRendererNodes<TForeignNodes>['comment']
				| null
		): void;
		/**
		 * Insert a node from a different renderer into this renderer's parent before the anchor.
		 * If anchor is null, insert at the end.
		 */
		insertForeign(
			parent: TElement | TFragment,
			element:
				| DefinedRendererNodes<TForeignNodes>['element']
				| DefinedRendererNodes<TForeignNodes>['fragment']
				| DefinedRendererNodes<TForeignNodes>['text']
				| DefinedRendererNodes<TForeignNodes>['comment'],
			anchor:
				| DefinedRendererNodes<TForeignNodes>['element']
				| DefinedRendererNodes<TForeignNodes>['text']
				| DefinedRendererNodes<TForeignNodes>['comment']
				| null
		): void;

		/** Remove a node that was inserted across renderer boundaries. */
		removeForeign(
			node:
				| DefinedRendererNodes<TForeignNodes>['element']
				| DefinedRendererNodes<TForeignNodes>['fragment']
				| DefinedRendererNodes<TForeignNodes>['text']
				| DefinedRendererNodes<TForeignNodes>['comment']
		): void;
		/** Remove a node that was inserted across renderer boundaries. */
		removeFromForeign(node: TNode): void;
	};
};

export type RendererBinding = {
	/** Push a state value to the native element. */
	update?(value: any): void;
	/** Release native subscriptions. */
	destroy?(): void;
};

type DefinedRendererNodes<TNodes extends RendererNodes<any, any, any, any, any> | undefined> =
	TNodes extends RendererNodes<any, any, any, any, any>
		? TNodes
		: RendererNodes<any, any, any, any, any>;

export type RendererNodes<
	Fragment extends object,
	Element extends object,
	TextNode extends object,
	Comment extends object,
	ForeignNode extends RendererNodes<any, any, any, any, any> = RendererNodes<
		any,
		any,
		any,
		any,
		any
	>
> = {
	fragment: Fragment;
	element: Element;
	text: TextNode;
	comment: Comment;
	foreign?: ForeignNode;
};

export type NodeType = Exclude<keyof RendererNodes<any, any, any, any, any>, 'foreign'>;

// to detect if the user is passing a type or not we create this type utils that adds a unique symbol
// that the user will never be able to pass in. We then create a a DefaultNodes type that is used as the default
// type for the T generic of `createRenderer`. This means we can "detect" if the user is passing a type manually by
// checking if the type extends DefaultNodes and using different default values
// for the other arguments (TFragment, TElement, TTextNode, TComment, TForeignNodes)
export type UnsetObject = object & { readonly __unset: unique symbol };
export type DefaultNodes = RendererNodes<UnsetObject, UnsetObject, UnsetObject, UnsetObject>;
