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
      <b-field label="Clock synched">
        {{ isClockSync }}
      </b-field>
      <b-field label="Time drift">
        {{ timeDrift }} ms
      </b-field>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import { checkClockSync } from '@parity/electron'

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
        isClockSync: '',
        timeDrift: '',
      }
    },
    methods: {
      async loadData() {
        let blockNumber = await this.$web3.eth.getBlockNumber()
        this.blockNumber = blockNumber.toLocaleString()
        this.isSyncing = await this.$web3.eth.isSyncing()
        this.peerCount = await this.$web3.eth.net.getPeerCount()

        let clockSync = await checkClockSync()
        this.isClockSync = clockSync.isClockSync
        this.timeDrift = clockSync.timeDrift
      }
    },
    async created() {
      this.web3Version = this.$web3.version
      let protocolVersion = await this.$web3.eth.getProtocolVersion()
      this.protocolVersion = this.$web3.utils.hexToNumber(protocolVersion)
      this.networkId = await this.$web3.eth.net.getId()

      this.$web3.eth.subscribe('newBlockHeaders')
      .on('data', block => {
        this.loadData()
      })

      this.$web3.eth.subscribe('syncing')
      .on('data', sync => {
        this.loadData()
      })

      this.loadData()
    },
  }
</script>
