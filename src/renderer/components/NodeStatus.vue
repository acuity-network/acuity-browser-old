<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">Node status</h1>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <b-field label="Web3 version">
            {{ web3Version }}
          </b-field>
          <b-field label="Protocol version">
            {{ protocolVersion }}
          </b-field>
          <b-field label="Network ID">
            {{ networkId }}
          </b-field>
          <b-field label="Block number">
            {{ blockNumber }}
          </b-field>
          <b-field label="Peer count">
            {{ peerCount }}
          </b-field>
          <b-field label="Syncing">
            {{ isSyncing }}
          </b-field>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
  export default {
    name: 'node-status',
    data() {
      return {
        web3Version: '',
        protocolVersion: '',
        networkId: '',
        blockNumber: '',
        peerCount: '',
        isSyncing: '',
      }
    },
    methods: {
      loadData() {
        this.$web3.eth.getBlockNumber()
        .then(blockNumber => {
          this.blockNumber = blockNumber.toLocaleString()
        })

        this.$web3.eth.isSyncing()
        .then(isSyncing => {
          this.isSyncing = isSyncing
        })

        this.$web3.eth.net.getPeerCount()
        .then(peerCount => {
          this.peerCount = peerCount
        })
      }
    },
    created() {
      this.web3Version = this.$web3.version

      this.$web3.eth.getProtocolVersion()
      .then(protocolVersion => {
        this.protocolVersion = this.$web3.utils.hexToNumber(protocolVersion)
      })

      this.$web3.eth.net.getId()
      .then(networkId => {
        this.networkId = networkId
      })

      this.$web3.eth.subscribe('newBlockHeaders')
      .on('data', block => {
        this.loadData()
      })

      this.loadData()
    },
  }
</script>
