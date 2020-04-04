<template>
	<b-field :label="$t('TopicSelector.Topics')">
		<b-taginput v-bind:value="value" v-on:input="$emit('input', $event)" icon="label" :placeholder="$t('TopicSelector.AddATopic')" autocomplete @typing="getFilteredTopics" :data="filteredTopics" allow-new></b-taginput>
	</b-field>
</template>

<script lang="ts">
  import Vue from 'vue'
  export default Vue.extend({
    name: 'topic-selector',
    props: {
			value: Array,
		},
		data() {
      return {
        topics: [],
				filteredTopics: [],
      }
    },
		async created() {
			await new Promise((resolve, reject) => {
        this.$db.createValueStream({
          'gte': '/accountTopicSubscribed/' + this.$activeAccount.get().contractAddress + '/',
          'lt': '/accountTopicSubscribed/' + this.$activeAccount.get().contractAddress + '/z',
        })
        .on('data', async (topicHash: string) => {
          this.topics.push(await this.$mixClient.itemTopics.methods.getTopic(topicHash).call())
        })
        .on('end', () => {
          resolve()
        })
      })
		},
		methods: {
			getFilteredTopics(text: string) {
				this.filteredTopics = this.topics.filter((topic: string) => {
					return (this.value.indexOf(topic) == -1) && (topic.toLowerCase().indexOf(text.toLowerCase()) >= 0)
				})
			}
		}
 })

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
