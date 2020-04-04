<template>
	<b-field :label="$t('TokenSelector.Token')">
		<b-select v-bind:value="value" v-on:input="$emit('input', $event)">
			<option
				v-for="token in tokens"
				:value="token.itemId"
				:key="token.itemId">
				{{ token.title }}
			</option>
		</b-select>
	</b-field>
</template>

<script lang="ts">
  import Vue from 'vue'
	import MixItem from '../../lib/MixItem'

  export default Vue.extend({
    name: 'token-selector',
    props: {
			value: String,
		},
		data() {
      return {
        tokens: [{itemId: '', title: 'none'}],
      }
    },
		async created() {
			let tokens = await this.$activeAccount.get().call(this.$mixClient.accountTokens, 'getAllItems')
			for (let itemId of tokens) {
				try {
					let item = await new MixItem(this.$root, itemId).init()
					let revision = await item.latestRevision().load()

					this.tokens.push({
						itemId: itemId,
						title: revision.getTitle(),
					})
				}
				catch (e) {}
			}
		},
 })
</script>
