<script>
	let show = $state(true);
	let el = $state();
	let div;

	export function get() {
		return el;
	}

	export function get_plain() {
		return div;
	}

	export function toggle() {
		show = !show;
	}
</script>

{#if show}
	<button bind:this={el}>a</button>
	<p bind:this={div}>b</p>
{/if}
