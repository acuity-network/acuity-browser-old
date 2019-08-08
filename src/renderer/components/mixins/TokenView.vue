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
      }
    },
    async created() {
			this.tokenAddress = await this.$mixClient.tokenRegistry.methods.getToken(this.itemId).call()
			let token = new this.$mixClient.web3.eth.Contract(require('../../../lib/contracts/CreatorToken.abi.json'), this.tokenAddress)
			this.tokenSymbol = await token.methods.symbol().call()
			this.tokenName = await token.methods.name().call()
			this.tokenStart = await token.methods.tokenStart().call()
			this.tokenOwner = await token.methods.tokenOwner().call()
			this.tokenPayout = await token.methods.tokenPayout().call()
			this.tokenSupply = await token.methods.totalSupply().call()
    },
  }
</script>
