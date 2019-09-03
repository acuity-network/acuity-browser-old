<template>
	<b-field label="Topics">
		<b-taginput v-bind:value="value" v-on:input="$emit('input', $event)" icon="label" placeholder="Add a topic" autocomplete @typing="getFilteredTopics" :data="filteredTopics" allow-new></b-taginput>
	</b-field>
</template>

<script>

  export default {
    name: 'topic-selector',
    props: ['value'],
		data() {
      return {
        topics: [],
				filteredTopics: [],
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
		methods: {
			getFilteredTopics(text) {
				this.filteredTopics = this.topics.filter((topic) => {
					return topic.toLowerCase().indexOf(text.toLowerCase()) >= 0
				})
			}
		}
 }

</script>

<style scoped>

	.taginput >>> .taginput-container .tag {
		background-color: #3273dc;
		color: #fff;
	}

	.taginput >>> .dropdown-item.is-hovered {
		background-color: #3273dc;
		color: #fff;
	}

	.taginput >>> .dropdown-item:hover {
		background-color: #3273dc;
		color: #fff;
	}

</style>
