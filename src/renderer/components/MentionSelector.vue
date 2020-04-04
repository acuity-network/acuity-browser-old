<template>
	<b-field :label="$t('MentionSelector.Mentions')">
		<b-taginput v-bind:value="value" v-on:input="$emit('input', $event)" icon="label" :placeholder="$t('MentionSelector.AddAMention')" autocomplete @typing="getFilteredTrustedAccounts" :data="filteredTrustedAccounts" field="name"></b-taginput>
	</b-field>
</template>

<script lang="ts">
  import Vue from 'vue'
	import MixAccount from '../../lib/MixAccount'
	import MixItem from '../../lib/MixItem'

  export default Vue.extend({
    name: 'mention-selector',
    props: {
			value: Array,
		},
		data() {
      return {
        trustedAccounts: [],
				filteredTrustedAccounts: [],
      }
    },
		async created() {
			let trustedAccounts = await this.$activeAccount.get().call(this.$mixClient.trustedAccounts, 'getAllTrusted')
			await trustedAccounts.forEach(async (contractAddress: string) => {
				let account: MixAccount = await new MixAccount(this.$root, contractAddress, true).init()
				let profileItemId = await account.call(this.$mixClient.accountProfile, 'getProfile')
				let profileItem: MixItem = await new MixItem(this.$root, profileItemId).init()
				let profileRevision = await profileItem.latestRevision().load()
				this.trustedAccounts.push({
					account: account.contractAddress,
					name: profileRevision.getTitle(),
				})
			})
		},
		methods: {
			getFilteredTrustedAccounts(text: string) {
				this.filteredTrustedAccounts = this.trustedAccounts.filter((account: any) => {
					return (this.value.indexOf(account) == -1) && (account.name.toLowerCase().indexOf(text.toLowerCase()) >= 0)
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
