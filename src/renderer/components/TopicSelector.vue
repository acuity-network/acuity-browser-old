<template>
	<b-field label="Topic">
		<b-input v-bind:value="value" v-on:input="$emit('input', $event)"></b-input>
	</b-field>
</template>

<script>

  export default {
    name: 'topic-selector',
    components: {
    },
    props: ['value'],
	}

</script>
