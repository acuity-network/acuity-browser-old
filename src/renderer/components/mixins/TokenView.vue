<template>
  <div>
		<b-field label="Address">
			{{ address }}
		</b-field>
		<b-field label="Symbol">
			{{ symbol }}
		</b-field>
		<b-field label="Name">
			{{ name }}
		</b-field>
		<b-field label="Start">
			{{ start }}
		</b-field>
		<b-field label="Owner">
      <profile-link :address="owner"></profile-link>
		</b-field>
    <b-field label="Initial balance">
			{{ initialBalance }}
		</b-field>
		<b-field label="Daily payout">
			{{ dailyPayout }}
		</b-field>
		<b-field label="Total supply">
			{{ totalSupply }}
		</b-field>
		<b-field label="Your balance">
			{{ balance }}
		</b-field>
		<b-tabs>
			<b-tab-item :label="$t('transactions')">
				<b-table :data="data" :row-class="(row, index) => (row.amount < 0) ? 'send' : 'receive'" default-sort="timestamp" default-sort-direction="desc">
					<template slot-scope="props">
						<b-table-column field="timestamp" :visible="false" sortable>
							{{ props.row.timestamp }}
						</b-table-column>

						<b-table-column :label="$t('when')">
							<timeago v-if="props.row.confirmed" :datetime="props.row.when" :autoUpdate="true"></timeago>
							<span v-else>pending</span>
						</b-table-column>

						<b-table-column label="Account">
              <profile-link :address="props.row.who"></profile-link>
						</b-table-column>

						<b-table-column :label="$t('amount')" numeric>
							{{ props.row.amount }}
						</b-table-column>
					</template>
				</b-table>
			</b-tab-item>

			<b-tab-item :label="$t('send')">
				<template v-if="!isConfirm">
					<b-field :label="$t('to')" :type="{ 'is-danger': toError }" :message="toError">
						<b-input v-model="to" @input="checkTo" placeholder="0x0000000000000000000000000000000000000000"></b-input>
					</b-field>
					<b-field v-if="!isSendAll" :label="$t('amount')" :type="{ 'is-danger': amountError }" :message="amountError">
						<b-input v-model="amount" @input="checkAmount"></b-input>
					</b-field>
					<b-field message="Send all account funds to the destination.">
						<b-checkbox v-model="isSendAll">
							Send all
						</b-checkbox>
					</b-field>
					<button type="submit" class="button is-primary" @click="send">{{ $t('send') }}</button>
				</template>
				<template v-else>
					<b-field :label="$t('to')">
						<code>{{ to }}</code>
					</b-field>
					<b-field :label="$t('amount')">
						{{ amount }}
					</b-field>
					<button type="button" class="button is-primary" @click="confirm">Confirm</button>
					<button type="button" class="button" @click="cancel">Cancel</button>
				</template>
			</b-tab-item>
      <b-tab-item label="Uniswap">
        <div class="tile is-ancestor">
          <div class="tile">
            <section>
              <b-field label="MIX Liquidity">
                {{ liquidityMix }}
              </b-field>
              <b-field label="Token Liquidity">
                {{ liquidityToken }}
              </b-field>
              <b-field label="My Liquidity">
                {{ liquidityMine }}
              </b-field>
              <b-field label="MIX per token">
          			{{ mixPerToken }}
          		</b-field>
            </section>
          </div>
        </div>
        <div class="tile is-ancestor">
          <div class="tile">
            <section>
              <b-field :label="$t('minLiquidity')">
                <b-input v-model="addLiquidityMinLiquidity"></b-input>
              </b-field>
              <b-field :label="$t('maxTokens')">
                <b-input v-model="addLiquidityMaxTokens"></b-input>
              </b-field>
              <b-field label="MIX">
                <b-input v-model="addLiquidityMix"></b-input>
              </b-field>
              <button type="submit" class="button" @click="addLiquidity">{{ $t('addLiquidity') }}</button>
            </section>
          </div>
          <div class="tile">
            <section>
              <b-field label="Amount of UNI burned">
                <b-input v-model="removeLiquidityUni"></b-input>
              </b-field>
              <b-field label="Minimum MIX withdrawn">
                <b-input v-model="removeLiquidityMinMix"></b-input>
              </b-field>
              <b-field label="Minimum tokens withdrawn">
                <b-input v-model="removeLiquidityMinTokens"></b-input>
              </b-field>
              <button type="submit" class="button" @click="removeLiquidity">{{ $t('removeLiquidity') }}</button>
            </section>
          </div>
          <div class="tile">
            <section>
              <b-field label="MIX">
                <b-input v-model="mixToTokensMix"></b-input>
              </b-field>
              <b-field label="Minimum tokens">
                <b-input v-model="mixToTokensMinTokens"></b-input>
              </b-field>
              <button type="submit" class="button" @click="mixToTokens">MIX to tokens</button>
            </section>
          </div>
          <div class="tile">
            <section>
              <b-field label="Tokens">
                <b-input v-model="tokensToMixTokens"></b-input>
              </b-field>
              <b-field label="Minimum MIX">
                <b-input v-model="tokensToMixMinMix"></b-input>
              </b-field>
              <button type="submit" class="button" @click="tokensToMix">Tokens to MIX</button>
            </section>
          </div>
        </div>
      </b-tab-item>
      <b-tab-item :label="$t('holders')">
        <token-holders v-if="address" :address="address"></token-holders>
      </b-tab-item>
		</b-tabs>
  </div>
</template>

<script>
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
        addLiquidityMinLiquidity: '',
        addLiquidityMaxTokens: '',
        addLiquidityMix: '',
        removeLiquidityUni: '',
        removeLiquidityMinMix: '',
        removeLiquidityMinTokens: '',
        mixToTokensMix: '',
        mixToTokensMinTokens: '',
        tokensToMixTokens: '',
        tokensToMixMinMix: '',
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
			let token = new this.$mixClient.web3.eth.Contract(require('../../../lib/contracts/CreatorToken.abi.json'), this.address)
			token.events.Transfer({
				filter: {
					from: window.activeAccount.contractAddress,
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

			token.events.Transfer({
				filter: {
					to: window.activeAccount.contractAddress,
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
		methods: {
			async loadData() {
				this.address = await this.$mixClient.tokenRegistry.methods.getToken(this.itemId).call()
				this.token = new this.$mixClient.web3.eth.Contract(require('../../../lib/contracts/CreatorToken.abi.json'), this.address)
				this.symbol = await this.token.methods.symbol().call()
				this.name = await this.token.methods.name().call()
				this.start =  new Date(await this.token.methods.start().call() * 1000).toLocaleDateString()
				this.owner = await this.token.methods.owner().call()
				let toBN = this.$mixClient.web3.utils.toBN
        this.initialBalance = this.$mixClient.web3.utils.fromWei(toBN(await this.token.methods.initialBalance().call()))
				this.dailyPayout = this.$mixClient.web3.utils.fromWei(toBN(await this.token.methods.dailyPayout().call()))
				this.totalSupply = this.$mixClient.web3.utils.fromWei(toBN(await this.token.methods.totalSupply().call()))
				this.balance = this.$mixClient.web3.utils.fromWei(toBN(await this.token.methods.balanceOf(window.activeAccount.contractAddress).call()))

        this.exchangeAddress = await this.$mixClient.uniswapFactory.methods.getExchange(this.address).call()
        this.exchange = new this.$mixClient.web3.eth.Contract(require('../../../lib/contracts/UniswapExchange.abi.json'), this.exchangeAddress)
        this.liquidityMix = this.$mixClient.web3.utils.fromWei(toBN(await this.$mixClient.web3.eth.getBalance(this.exchangeAddress, 'pending')))
        this.liquidityToken = this.$mixClient.web3.utils.fromWei(toBN(await this.token.methods.balanceOf(this.exchangeAddress).call()))
        this.liquidityMine = this.$mixClient.web3.utils.fromWei(toBN(await this.exchange.methods.balanceOf(window.activeAccount.contractAddress).call()))
        try {
          this.mixPerToken = this.$mixClient.web3.utils.fromWei(toBN(await this.exchange.methods.getEthToTokenOutputPrice(this.$mixClient.web3.utils.toWei('1')).call()))
        }
        catch (e) {}
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
          this.toError = 'Invalid address.'
          error = true
        }

        if (this.isSendAll) {
          let balance = toBN(await window.activeAccount.getControllerBalance())
          let gas = await window.activeAccount.getSendMixGas(this.to, balance) + 200000
          this.amount = this.$mixClient.web3.utils.fromWei(balance.sub(toBN(gas).mul(toBN('1000000000'))))
        }
        else {
          try {
            if (toBN(this.$mixClient.web3.utils.toWei(this.amount)).lte(toBN(0))) {
              throw null
            }
          }
          catch (e) {
            this.amountError = 'Invalid amount.'
            error = true
          }
        }

        if (error) {
          return false
        }

        this.isConfirm = true
			},
			async cancel(event) {
	      if (this.isSendAll) {
	        this.amount = ''
	      }
	      this.isConfirm = false
	    },
	    async confirm(event) {
				let contract = new this.$mixClient.web3.eth.Contract(require('../../../lib/contracts/CreatorToken.abi.json'), this.address)
				await window.activeAccount.sendData(contract, 'transfer', [this.to, this.$mixClient.web3.utils.toWei(this.amount)], 0, 'Send token')
	      this.loadData()
	      this.to = ''
	      this.amount = ''
	      this.isSendAll = false
	      this.isConfirm = false
	    },
      async addLiquidity(event) {
        await window.activeAccount.sendData(this.token, 'authorize', [this.exchangeAddress], 0, 'Authorize exchange')
        let minLiquidity = this.$mixClient.web3.utils.toWei(this.addLiquidityMinLiquidity)
        let maxTokens = this.$mixClient.web3.utils.toWei(this.addLiquidityMaxTokens)
        let mix = this.$mixClient.web3.utils.toWei(this.addLiquidityMix)
        await window.activeAccount.sendData(this.exchange, 'addLiquidity', [minLiquidity, maxTokens, '4000000000'], mix, 'Add liquidity')
        this.loadData()
      },
      async removeLiquidity(event) {
        let uni = this.$mixClient.web3.utils.toWei(this.removeLiquidityUni)
        let minMix = this.$mixClient.web3.utils.toWei(this.removeLiquidityMinMix)
        let minTokens = this.$mixClient.web3.utils.toWei(this.removeLiquidityMinTokens)
        await window.activeAccount.sendData(this.exchange, 'removeLiquidity', [uni, minMix, minTokens, '4000000000'], 0, 'Remove liquidity')
        this.loadData()
      },
      async mixToTokens(event) {
        let minTokens = this.$mixClient.web3.utils.toWei(this.mixToTokensMinTokens)
        let mix = this.$mixClient.web3.utils.toWei(this.mixToTokensMix)
        await window.activeAccount.sendData(this.exchange, 'ethToTokenSwapInput', [minTokens, '4000000000'], mix, 'Swap MIX for tokens')
        this.loadData()
      },
      async tokensToMix(event) {
        let tokens = this.$mixClient.web3.utils.toWei(this.tokensToMixTokens)
        let minMix = this.$mixClient.web3.utils.toWei(this.tokensToMixMinMix)
        await window.activeAccount.sendData(this.exchange, 'tokenToEthSwapInput', [tokens, minMix, '4000000000'], 0, 'Swap tokens for MIX')
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
