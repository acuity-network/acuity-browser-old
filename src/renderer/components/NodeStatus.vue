<template>
  <page>
    <template slot="title">
      Node Status
    </template>

    <template slot="body">
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
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'

  export default {
    name: 'node-status',
    components: {
      Page,
    },
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
