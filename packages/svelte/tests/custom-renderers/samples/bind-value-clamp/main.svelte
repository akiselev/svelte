<script>
	let n = $state(1);

	export function get() {
		return n;
	}

	export function set(v) {
		n = v;
	}
</script>

<spin max="10" bind:value={n} />
<p>{n}</p>
