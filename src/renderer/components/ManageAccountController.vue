<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">Manage account</h1>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <img :src="qrcode" />
          <h2 class="subtitle">Balance</h2>
          {{ balance }}
        </div>
          {{ contract }}
        <div>
          <button class="button is-primary" v-on:click="activate">Activate account</button>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
  var QRCode = require('qrcode')
  var fs = require('fs-extra')
  const accountAbi = require('./Account.abi.json')

  export default {
    name: 'manage-account-controller',
    components: {},
    asyncComputed: {
      qrcode() {
        return QRCode.toDataURL(this.$route.params.address, {
          mode: 'alphanumeric',
          errorCorrectionLevel: 'H'
        })
      },
      contract() {
        return this.$db.get('/account/' + this.$route.params.address + '/contract')
      },
      balance() {
        return this.$web3.eth.getBalance(this.$route.params.address, 'pending')
        .then(balance => {
          return this.$web3.utils.fromWei(balance) + ' MIX'
        })
      }
    },
    methods: {
      activate() {
        fs.readFile('./src/renderer/components/Account.bin', 'utf8')
        .then(accountBytecode => {
          const account = new this.$web3.eth.Contract(accountAbi)
          account.deploy({data: '0x' + accountBytecode}).send({
            from: this.$route.params.address,
            gas: 500000,
            gasPrice: 1
          })
          .on('error', error => {
            console.log(error)
          })
          .on('transactionHash', transactionHash => {
            console.log(transactionHash)
          })
          .on('receipt', receipt => {
            console.log(receipt)
            this.$db.put('/account/' + this.$route.params.address + '/contract', receipt.contractAddress)
            .then(result => {
              console.log(result)
            })
          })
          .then(newContractInstance => {
            console.log(newContractInstance)
          })
        })
      }
    }
  }
</script>
