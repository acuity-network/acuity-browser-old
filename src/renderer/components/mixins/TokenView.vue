<template>
  <div>
		<b-field :label="$t('TokenView.Address')">
			{{ address }}
		</b-field>
		<b-field :label="$t('TokenView.Symbol')">
			{{ symbol }}
		</b-field>
		<b-field :label="$t('TokenView.Name')">
			{{ name }}
		</b-field>
		<b-field :label="$t('TokenView.Start')">
			{{ start }}
		</b-field>
		<b-field :label="$t('TokenView.Owner')">
      <profile-link :address="owner"></profile-link>
		</b-field>
    <b-field :label="$t('TokenView.InitialBalance')">
			{{ initialBalance }}
		</b-field>
		<b-field :label="$t('TokenView.DailyPayout')">
			{{ dailyPayout }}
		</b-field>
		<b-field :label="$t('TokenView.TotalSupply')">
			{{ totalSupply }}
		</b-field>
		<b-field :label="$t('TokenView.YourBalance')">
			{{ balance }}
		</b-field>
		<b-tabs>
			<b-tab-item :label="$t('TokenView.Transactions')">
				<b-table :data="data" :row-class="(row, index) => (row.amount < 0) ? 'send' : 'receive'" default-sort="timestamp" default-sort-direction="desc">
					<template slot-scope="props">
						<b-table-column field="timestamp" :visible="false" sortable>
							{{ props.row.timestamp }}
						</b-table-column>

						<b-table-column :label="$t('TokenView.When')">
							<timeago v-if="props.row.confirmed" :datetime="props.row.when" :autoUpdate="true"></timeago>
							<span v-else>{{ $t('TokenView.Pending') }}</span>
						</b-table-column>

						<b-table-column :label="$t('TokenView.Account')">
              <profile-link :address="props.row.who" :key="props.row.who"></profile-link>
						</b-table-column>

						<b-table-column :label="$t('TokenView.Amount')" numeric>
							{{ props.row.amount }}
						</b-table-column>
					</template>
				</b-table>
			</b-tab-item>

			<b-tab-item :label="$t('TokenView.Send')">
				<template v-if="!isConfirm">
					<b-field :label="$t('TokenView.To')" :type="{ 'is-danger': toError }" :message="toError">
						<b-input v-model="to" @input="checkTo" placeholder="0x0000000000000000000000000000000000000000"></b-input>
					</b-field>
					<b-field v-if="!isSendAll" :label="$t('TokenView.Amount')" :type="{ 'is-danger': amountError }" :message="amountError">
						<b-input v-model="amount" @input="checkAmount"></b-input>
					</b-field>
					<b-field message="Send all account funds to the destination.">
						<b-checkbox v-model="isSendAll">
							{{ $t('TokenView.SendAll') }}
						</b-checkbox>
					</b-field>
					<button type="submit" class="button is-primary" @click="send">{{ $t('TokenView.Send') }}</button>
				</template>
				<template v-else>
					<b-field :label="$t('TokenView.To')">
						<code>{{ to }}</code>
					</b-field>
					<b-field :label="$t('TokenView.Amount')">
						{{ amount }}
					</b-field>
					<button type="button" class="button is-primary" @click="confirm">{{ $t('TokenView.Confirm') }}</button>
					<button type="button" class="button" @click="cancel">Cancel</button>
				</template>
			</b-tab-item>
      <b-tab-item label="Uniswap">
        <div class="tile is-ancestor">
          <div class="tile">
            <section>
              <b-field :label="$t('TokenView.MixLiquidity')">
                {{ liquidityMix }}
              </b-field>
              <b-field :label="$t('TokenView.TokenLiquidity')">
                {{ liquidityToken }}
              </b-field>
              <b-field :label="$t('TokenView.MyLiquidity')">
                {{ liquidityMine }}
              </b-field>
              <b-field :label="$t('TokenView.MixPerToken')">
          			{{ mixPerToken }}
          		</b-field>
            </section>
          </div>
        </div>
        <div class="tile is-ancestor">
          <div class="tile">
            <section>
              <b-field :label="$t('TokenView.MaxTokens')">
                <b-input v-model="addLiquidityMaxTokens"></b-input>
              </b-field>
              <b-field label="MIX">
                <b-input v-model="addLiquidityMix"></b-input>
              </b-field>
              <button type="submit" class="button" @click="addLiquidity">{{ $t('TokenView.AddLiquidity') }}</button>
            </section>
          </div>
          <div class="tile">
            <section>
              <b-field :label="$t('TokenView.Liquidity')">
                <b-input v-model="removeLiquidityUni"></b-input>
              </b-field>
              <button type="submit" class="button" @click="removeLiquidity">{{ $t('TokenView.RemoveLiquidity') }}</button>
            </section>
          </div>
          <div class="tile">
            <section>
              <b-field label="MIX">
                <b-input v-model="mixToTokensMix"></b-input>
              </b-field>
              <button type="submit" class="button" @click="mixToTokens">{{ $t('TokenView.MixToTokens') }}</button>
            </section>
          </div>
          <div class="tile">
            <section>
              <b-field :label="$t('TokenView.Tokens')">
                <b-input v-model="tokensToMixTokens"></b-input>
              </b-field>
              <button type="submit" class="button" @click="tokensToMix">{{ $t('TokenView.TokensToMix') }}</button>
            </section>
          </div>
        </div>
      </b-tab-item>
      <b-tab-item :label="$t('TokenView.Holders')">
        <token-holders v-if="address" :address="address" :itemId="itemId"></token-holders>
      </b-tab-item>
		</b-tabs>
  </div>
</template>

<script lang="ts">
  import TokenHolders from '../TokenHolders.vue'
  import ProfileLink from '../ProfileLink.vue'

  export default {
    name: 'token-view',
    props: ['itemId'],
    components: {
      TokenHolders,
      ProfileLink,
    },
    data() {
      return {
				symbol: '',
        name: '',
        start: '',
        owner: '',
        initialBalance: '',
        dailyPayout: '',
        totalSupply: '',
        address: '',
				balance: '',
				to: '',
        toError: '',
        amount: '',
        amountError: '',
        isSendAll: false,
        isConfirm: false,
				data: [],
        liquidityMix: '',
        liquidityToken: '',
        liquidityMine: '',
        mixPerToken: '',
        addLiquidityMaxTokens: '',
        addLiquidityMix: '',
        removeLiquidityUni: '',
        mixToTokensMix: '',
        tokensToMixTokens: '',
      }
    },
		checkTo(event) {
			if (this.$mixClient.web3.utils.isAddress(this.to)) {
				this.toError = ''
			}
		},
		checkAmount(event) {
			let toBN = this.$mixClient.web3.utils.toBN
			try {
				if (toBN(this.$mixClient.web3.utils.toWei(this.amount)).lte(toBN(0))) {
					throw null
				}
			}
			catch (e) {
				return
			}
			this.amountError = ''
		},
    async created() {
			await this.loadData()
			let token = new this.$mixClient.web3.eth.Contract(require('../../../lib/contracts/MixCreatorToken.abi.json'), this.address)
			this.transferFromEmitter = token.events.Transfer({
				filter: {
					from: this.$activeAccount.get().contractAddress,
				},
				fromBlock: 0,
				toBlock: 'pending',
			})
			.on('data', async log => {
				let block = await this.$mixClient.web3.eth.getBlock(log.blockNumber)
				this.data.push({
					'timestamp': block ? block.timestamp : 4000000000,
					'confirmed': block != null,
					'when': block ? new Date(block.timestamp * 1000) : null,
					'who': log.returnValues.to,
					'amount': '-' + this.$mixClient.web3.utils.fromWei(this.$mixClient.web3.utils.toBN(log.returnValues.value)),
				})
			})

			this.transferToEmitter = token.events.Transfer({
				filter: {
					to: this.$activeAccount.get().contractAddress,
				},
				fromBlock: 0,
				toBlock: 'pending',
			})
			.on('data', async log => {
				let block = await this.$mixClient.web3.eth.getBlock(log.blockNumber)
				this.data.push({
					'timestamp': block ? block.timestamp : 4000000000,
					'confirmed': block != null,
					'when': block ? new Date(block.timestamp * 1000) : null,
					'who': log.returnValues.from,
					'amount': this.$mixClient.web3.utils.fromWei(this.$mixClient.web3.utils.toBN(log.returnValues.value)),
				})
			})
    },
    destroyed() {
      this.transferFromEmitter.unsubscribe()
      this.transferToEmitter.unsubscribe()
    },
		methods: {
			async loadData() {
        try {
  				this.address = await this.$mixClient.tokenItemRegistry.methods.getToken(this.itemId).call()
        }
        catch (e) {
          this.address = await this.$mixClient.tokenItemRegistryOld.methods.getToken(this.itemId).call()
          await this.$activeAccount.get().sendData(this.$mixClient.tokenItemRegistry, 'register', [this.address, this.itemId], 0, 'Register token item')
        }
				this.token = new this.$mixClient.web3.eth.Contract(require('../../../lib/contracts/MixCreatorToken.abi.json'), this.address)
				this.symbol = await this.token.methods.symbol().call()
				this.name = await this.token.methods.name().call()
				this.start =  new Date(await this.token.methods.start().call() * 1000).toLocaleDateString()
				this.owner = await this.token.methods.owner().call()
				let toBN = this.$mixClient.web3.utils.toBN
        this.initialBalance = this.$mixClient.web3.utils.fromWei(toBN(await this.token.methods.initialBalance().call()))
				this.dailyPayout = this.$mixClient.web3.utils.fromWei(toBN(await this.token.methods.dailyPayout().call()))
				this.totalSupply = this.$mixClient.web3.utils.fromWei(toBN(await this.token.methods.totalSupply().call()))
				this.balance = this.$mixClient.web3.utils.fromWei(toBN(await this.token.methods.balanceOf(this.$activeAccount.get().contractAddress).call()))

        this.exchangeAddress = await this.$mixClient.uniswapFactory.methods.getExchange(this.address).call()
        this.exchange = new this.$mixClient.web3.eth.Contract(require('../../../lib/contracts/UniswapExchange.abi.json'), this.exchangeAddress)
        this.liquidityMix = this.$mixClient.web3.utils.fromWei(toBN(await this.$mixClient.web3.eth.getBalance(this.exchangeAddress, 'pending')))
        this.liquidityToken = this.$mixClient.web3.utils.fromWei(toBN(await this.token.methods.balanceOf(this.exchangeAddress).call()))
        this.liquidityMine = this.$mixClient.web3.utils.fromWei(toBN(await this.exchange.methods.balanceOf(this.$activeAccount.get().contractAddress).call()))
        try {
          this.mixPerToken = this.$mixClient.web3.utils.fromWei(toBN(await this.exchange.methods.getEthToTokenOutputPrice(this.$mixClient.web3.utils.toWei('1')).call()))
        }
        catch (e) {
          this.mixPerToken = this.$t('TokenView.NA')
        }
			},
			checkTo(event) {
        if (this.$mixClient.web3.utils.isAddress(this.to)) {
          this.toError = ''
        }
      },
      checkAmount(event) {
        let toBN = this.$mixClient.web3.utils.toBN
        try {
          if (toBN(this.$mixClient.web3.utils.toWei(this.amount)).lte(toBN(0))) {
            throw null
          }
        }
        catch (e) {
          return
        }
        this.amountError = ''
      },
			async send(event) {
				let toBN = this.$mixClient.web3.utils.toBN
        this.to = this.to.trim()

        let error = false
        if (!this.$mixClient.web3.utils.isAddress(this.to)) {
          this.toError = this.$t('TokenView.InvalidAddress')
          error = true
        }

        if (this.isSendAll) {
          let balance = toBN(await this.$activeAccount.get().getControllerBalance())
          let gas = await this.$activeAccount.get().getSendMixGas(this.to, balance) + 200000
          this.amount = this.$mixClient.web3.utils.fromWei(balance.sub(toBN(gas).mul(toBN('1000000000'))))
        }
        else {
          try {
            if (toBN(this.$mixClient.web3.utils.toWei(this.amount)).lte(toBN(0))) {
              throw null
            }
          }
          catch (e) {
            this.amountError = this.$t('TokenView.InvalidAmount')
            error = true
          }
        }

        if (!error) {
          this.isConfirm = true
        }
			},
			async cancel(event) {
	      if (this.isSendAll) {
	        this.amount = ''
	      }
	      this.isConfirm = false
	    },
	    async confirm(event) {
				let contract = new this.$mixClient.web3.eth.Contract(require('../../../lib/contracts/MixCreatorToken.abi.json'), this.address)
				await this.$activeAccount.get().sendData(contract, 'transfer', [this.to, this.$mixClient.web3.utils.toWei(this.amount)], 0, 'Send token')
	      this.loadData()
	      this.to = ''
	      this.amount = ''
	      this.isSendAll = false
	      this.isConfirm = false
	    },
      async addLiquidity(event) {
        await this.$activeAccount.get().sendData(this.token, 'authorize', [this.exchangeAddress], 0, 'Authorize exchange')
        let maxTokens = this.$mixClient.web3.utils.toWei(this.addLiquidityMaxTokens)
        let mix = this.$mixClient.web3.utils.toWei(this.addLiquidityMix)
        await this.$activeAccount.get().sendData(this.exchange, 'addLiquidity', [1, maxTokens, '4000000000'], mix, 'Add liquidity')
        this.loadData()
      },
      async removeLiquidity(event) {
        let uni = this.$mixClient.web3.utils.toWei(this.removeLiquidityUni)
        await this.$activeAccount.get().sendData(this.exchange, 'removeLiquidity', [uni, 1, 1, '4000000000'], 0, 'Remove liquidity')
        this.loadData()
      },
      async mixToTokens(event) {
        let mix = this.$mixClient.web3.utils.toWei(this.mixToTokensMix)
        await this.$activeAccount.get().sendData(this.exchange, 'ethToTokenSwapInput', [1, '4000000000'], mix, 'Swap MIX for tokens')
        this.loadData()
      },
      async tokensToMix(event) {
        let tokens = this.$mixClient.web3.utils.toWei(this.tokensToMixTokens)
        await this.$activeAccount.get().sendData(this.exchange, 'tokenToEthSwapInput', [tokens, 1, '4000000000'], 0, 'Swap tokens for MIX')
        this.loadData()
      },
		},
  }
</script>

<style scoped>
  tr.receive td {
    background-color: #013220;
  }

  tr.send td {
    background-color: #660000;
  }

  code {
    background-color: transparent;
  }

</style>
