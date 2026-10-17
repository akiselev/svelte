<script>
	let el = $state();

	export function get() {
		return el;
	}
</script>

<button bind:this={el}>a</button>
