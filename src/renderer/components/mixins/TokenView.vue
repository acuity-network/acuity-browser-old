<template>
  <div>
		<b-field label="Token address">
			{{ tokenAddress }}
		</b-field>
		<b-field label="Token symbol">
			{{ tokenSymbol }}
		</b-field>
		<b-field label="Token name">
			{{ tokenName }}
		</b-field>
		<b-field label="Token start">
			{{ tokenStart }}
		</b-field>
		<b-field label="Token owner">
			{{ tokenOwner }}
		</b-field>
		<b-field label="Token payout">
			{{ tokenPayout }}
		</b-field>
		<b-field label="Token supply">
			{{ tokenSupply }}
		</b-field>
		<b-field label="Balance">
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

						<b-table-column label="Address">
							<code>{{ props.row.who }}</code>
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
		</b-tabs>
  </div>
</template>

<script>

  export default {
    name: 'token-view',
    props: ['itemId'],
    components: {
    },
    data() {
      return {
				tokenSymbol: '',
        tokenName: '',
        tokenStart: '',
        tokenOwner: '',
        tokenPayout: '',
        tokenSupply: '',
        tokenAddress: '',
				balance: '',
				to: '',
        toError: '',
        amount: '',
        amountError: '',
        isSendAll: false,
        isConfirm: false,
				data: [],
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
			let token = new this.$mixClient.web3.eth.Contract(require('../../../lib/contracts/CreatorToken.abi.json'), this.tokenAddress)
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
				this.tokenAddress = await this.$mixClient.tokenRegistry.methods.getToken(this.itemId).call()
				let token = new this.$mixClient.web3.eth.Contract(require('../../../lib/contracts/CreatorToken.abi.json'), this.tokenAddress)
				this.tokenSymbol = await token.methods.symbol().call()
				this.tokenName = await token.methods.name().call()
				this.tokenStart = await token.methods.tokenStart().call()
				this.tokenOwner = await token.methods.tokenOwner().call()
				let toBN = this.$mixClient.web3.utils.toBN
				this.tokenPayout = this.$mixClient.web3.utils.fromWei(toBN(await token.methods.tokenPayout().call()))
				this.tokenSupply = this.$mixClient.web3.utils.fromWei(toBN(await token.methods.totalSupply().call()))
				this.balance = this.$mixClient.web3.utils.fromWei(toBN(await token.methods.balanceOf(window.activeAccount.contractAddress).call()))
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
				let contract = new this.$mixClient.web3.eth.Contract(require('../../../lib/contracts/CreatorToken.abi.json'), this.tokenAddress)
				let tx = await window.activeAccount.sendData(contract, 'transfer', [this.to, this.$mixClient.web3.utils.toWei(this.amount)], 0, 'Send token')
				console.log(tx)
	      this.loadData()
	      this.to = ''
	      this.amount = ''
	      this.isSendAll = false
	      this.isConfirm = false
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
