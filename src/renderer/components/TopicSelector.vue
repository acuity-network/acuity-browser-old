<template>
	<div>
		<b-field label="Topics">
			<b-taginput v-bind:value="value" v-on:input="$emit('input', $event)" icon="label" placeholder="Add a tag"></b-taginput>
		</b-field>
	</div>
</template>

<script>

  export default {
    name: 'topic-selector',
    components: {
    },
    props: ['value'],
		data() {
      return {
        topics: [],
      }
    },
		async created() {
			await new Promise((resolve, reject) => {
        this.$db.createValueStream({
          'gte': '/accountTopicSubscribed/' + window.activeAccount.contractAddress + '/',
          'lt': '/accountTopicSubscribed/' + window.activeAccount.contractAddress + '/z',
        })
        .on('data', async topicHash => {
          this.topics.push(await this.$mixClient.itemTopics.methods.getTopic(topicHash).call())
        })
        .on('end', () => {
          resolve()
        })
      })
		},
	}

</script>
