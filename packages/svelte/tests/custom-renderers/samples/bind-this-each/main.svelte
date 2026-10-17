<script>
	let items = $state([{ id: 1 }, { id: 2 }, { id: 3 }]);
	let els = $state([]);
	let by_id = {};

	export function get_els() {
		return els;
	}

	export function get_by_id() {
		return by_id;
	}

	export function remove(id) {
		items = items.filter((item) => item.id !== id);
	}

	export function reverse() {
		items = items.toReversed();
	}
</script>

<ul>
	{#each items as item (item.id)}
		<li bind:this={by_id[item.id]}>{item.id}</li>
	{/each}
	{#each items as item, i}
		<li bind:this={els[i]}>{item.id}</li>
	{/each}
</ul>
