<template>
	<div v-if="show" class="item-token">
		<div class="tile is-ancestor">
		  <div class="tile is-parent is-4">
        <article class="tile is-child notification is-info">
          <div class="token-image is-pulled-right" v-html="image"></div>
          <p class="title">Token</p>
          <p class="subtitle"><item-link :itemId="tokenItemId" :key="tokenItemId"></item-link></p>
					<b-field label="Your balance">
						{{ balance }}
					</b-field>
					<b-field label="You've burned">
						{{ burned }}
					</b-field>
					<b-field label="Total burned">
						{{ totalBurned }}
					</b-field>
        </article>
      </div>
			<div class="tile is-parent is-4">
	      <article class="tile is-child notification is-success">
	        <p class="title">Buy Token</p>
          <b-field :label="$t('TokenView.MixPerToken')">
            {{ mixPerToken }}
          </b-field>
					<b-field label="MIX to spend" :message="mixToTokensTokens">
						<b-input v-model="mixToTokensMix" @keyup.native="tryMixToTokens"></b-input>
					</b-field>
					<button type="submit" class="button" @click="mixToTokens">Buy</button>
	      </article>
			</div>
			<div class="tile is-parent is-4">
		    <article class="tile is-child notification is-danger">
	        <p class="title">Burn Token</p>
					<b-field label="Tokens to burn">
						<b-input v-model="tokensToBurn"></b-input>
					</b-field>
					<button type="submit" class="button" @click="burnTokens">Burn</button>
		    </article>
			</div>
		</div>
		<b-table :data="data">
			<template slot-scope="props">
				<b-table-column label="Account">
					<profile-link :address="props.row.account"></profile-link>
				</b-table-column>
				<b-table-column label="Burned">
					{{ props.row.burned }}
				</b-table-column>
			</template>
		</b-table>
	</div>
</template>

<script lang="ts">
	import ItemLink from './ItemLink.vue'
	import ProfileLink from './ProfileLink.vue'
	import MixItem from '../../lib/MixItem'

  export default {
    name: 'item-token',
    props: {
			itemId: String,
		},
		components: {
      ItemLink,
			ProfileLink,
    },
		data() {
      return {
        show: false,
				tokenItemId: '',
        image: '',
				balance: '',
				burned: '',
				totalBurned: '',
        mixPerToken: '',
				mixToTokensMix: '',
        mixToTokensTokens: '',
				tokensToBurn: '',
				data: [],
      }
    },
		async created() {
      try {
  			this.tokenItemId = await this.$mixClient.itemDagTokenItems.methods.getParentId(this.itemId).call()
        let item = await new MixItem(this.$root, this.tokenItemId).init()
        let revision = await item.latestRevision().load()
        this.image = revision.getImage(64, 64)
        this.address = await this.$mixClient.tokenItemRegistry.methods.getToken(this.tokenItemId).call()
  			this.token = new this.$mixClient.web3.eth.Contract(require('../../lib/contracts/MixCreatorToken.abi.json'), this.address)
  			this.exchangeAddress = await this.$mixClient.uniswapFactory.methods.getExchange(this.address).call()
  			this.exchange = new this.$mixClient.web3.eth.Contract(require('../../lib/contracts/UniswapExchange.abi.json'), this.exchangeAddress)
  			this.loadData()
        this.show = true
      }
      catch (e) {}
		},
		methods: {
			async loadData() {
				let toBN = this.$mixClient.web3.utils.toBN
				this.totalBurned = this.$mixClient.web3.utils.fromWei(toBN(await this.$mixClient.tokenBurn.methods.getItemBurnedTotal(this.itemId).call()))
				this.burned = this.$mixClient.web3.utils.fromWei(toBN(await this.$mixClient.tokenBurn.methods.getAccountItemBurned(this.$activeAccount.get().contractAddress, this.itemId).call()))
				this.balance = this.$mixClient.web3.utils.fromWei(toBN(await this.token.methods.balanceOf(this.$activeAccount.get().contractAddress).call()))
        try {
          this.mixPerToken = this.$mixClient.web3.utils.fromWei(toBN(await this.exchange.methods.getEthToTokenOutputPrice(this.$mixClient.web3.utils.toWei('1')).call()))
        }
        catch (e) {
          this.mixPerToken = 'N/A'
        }
				let data = await this.$mixClient.tokenBurn.methods.getItemAccountsBurned(this.itemId, 0, 200).call()
				let count = data.accounts.length
				for (let i = 0; i < count; i++) {
					this.data.push({
						'account': data.accounts[i],
						'burned': this.$mixClient.web3.utils.fromWei(toBN(data.amounts[i])),
					})
				}

			},
      async tryMixToTokens(event) {
        try {
          let mix = this.$mixClient.web3.utils.toWei(this.mixToTokensMix)
          let toBN = this.$mixClient.web3.utils.toBN
          this.mixToTokensTokens = this.$mixClient.web3.utils.fromWei(toBN(await this.$activeAccount.get().call(this.exchange, 'ethToTokenSwapInput', [1, '4000000000'], mix)))
        }
        catch (e) {
          this.mixToTokensTokens = ''
        }
      },
			async mixToTokens(event) {
				let mix = this.$mixClient.web3.utils.toWei(this.mixToTokensMix)
				await this.$activeAccount.get().sendData(this.exchange, 'ethToTokenSwapInput', [1, '4000000000'], mix, 'Swap MIX for tokens')
				this.loadData()
			},
			async burnTokens(event) {
				let tokens: number = this.$mixClient.web3.utils.toWei(this.tokensToBurn)
				let result = await this.$activeAccount.get().call(this.$mixClient.tokenBurn, 'getBurnItemPrev', [this.itemId, tokens])
				await this.$activeAccount.get().sendData(this.token, 'authorize', [this.$mixClient.tokenBurnAddress], 0, 'Authorize token burn contract')
				await this.$activeAccount.get().sendData(this.$mixClient.tokenBurn, 'burnItem', [this.itemId, tokens, result.tokenPrev, result.tokenOldPrev, result.itemPrev, result.itemOldPrev], 0, 'Burn tokens', 2000000)
				this.loadData()
			}
		},
}
</script>

<style scoped>
  .item-token >>> label.label {
    color: white;
  }

  .item-token >>> .notification {
    padding: 1.25rem;
  }

  .token-image >>> img {
    background-color: white;
    padding: 6px;
    object-fit: cover;
    width: 70px;
    height: 70px;
  }
</style>
