<script>
	let value = $state('a');

	export function get() {
		return value;
	}

	export function set(v) {
		value = v;
	}
</script>

<entry bind:value />
<p>{value}</p>
