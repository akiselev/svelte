<script>
	let v = $state('x');

	export function get() {
		return v;
	}
</script>

<entry bind:value={() => v, (next) => (v = next.toUpperCase())} />
<p>{v}</p>
