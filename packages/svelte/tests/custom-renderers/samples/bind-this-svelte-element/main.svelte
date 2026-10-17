<script>
	let tag = $state('section');
	let el = $state();

	export function get() {
		return el;
	}

	export function set_tag(t) {
		tag = t;
	}
</script>

<svelte:element this={tag} bind:this={el}>x</svelte:element>
