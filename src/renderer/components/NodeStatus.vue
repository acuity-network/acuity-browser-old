<template>
  <page>
    <template slot="title">
      Node Status
    </template>

    <template slot="body">
      <div class="columns">
        <div class="column">
          <h2 class="subtitle">MIX Blockchain</h2>
          <div v-if="downloadingParity === true">
            <b-field label="Parity downloading">
              <progress-bar size="tiny" :val="parityDownloadProgress" max="1000" bar-transition="none" />
            </b-field>
          </div>
          <div v-if="downloadingParity === false">
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
            <b-field label="Catching up">
              <div v-if="isSyncing">
                <progress-bar size="tiny" :val="syncProgress" :max="syncTotal" bar-transition="none" />
              </div>
              <div v-else>
                no
              </div>
            </b-field>
            <b-field label="Clock synced">
              <span v-if="isClockSync">yes</span>
              <span v-else>no</span>
            </b-field>
            <b-field label="Time drift">
              {{ timeDrift }} ms
            </b-field>
          </div>
        </div>
        <div class="column">
          <h2 class="subtitle">IPFS</h2>
          <b-field label="Agent">
            {{ ipfsAgent }}
          </b-field>
          <b-field label="Protocol">
            {{ ipfsProtocol }}
          </b-field>
          <b-field label="Addresses">
            <ul>
              <li v-for="address in ipfsAddresses">
                {{ address }}
              </li>
            </ul>
          </b-field>
          <b-field label="Peer count">
            {{ ipfsPeerCount }}
          </b-field>
        </div>
      </div>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import { checkClockSync } from '@parity/electron'
  import throttle from 'just-throttle'
  import { ipcRenderer } from 'electron'
  import ProgressBar from 'vue-simple-progress'

  export default {
    name: 'node-status',
    components: {
      Page,
      ProgressBar,
    },
    data() {
      return {
        downloadingParity: null,
        parityDownloadProgress: '',
        web3Version: '',
        protocolVersion: '',
        networkId: '',
        blockNumber: '',
        peerCount: '',
        isSyncing: false,
        isClockSync: '',
        timeDrift: '',
        startingBlock: 0,
        highestBlock: 0,
        syncTotal: 0,
        syncProgress: 0,
        ipfsAgent: '',
        ipfsProtocol: '',
        ipfsAddresses: [],
        ipfsPeerCount: '',
      }
    },
    methods: {
      async start() {
        this.downloadingParity = false
        this.web3Version = this.$web3.version
        let protocolVersion = await this.$web3.eth.getProtocolVersion()
        this.protocolVersion = this.$web3.utils.hexToNumber(protocolVersion)
        this.networkId = await this.$web3.eth.net.getId()
        let clockSync = await checkClockSync()
        this.isClockSync = clockSync.isClockSync
        this.timeDrift = Math.round(clockSync.timeDrift)

        let loadData = throttle(this.loadData, 500, true)

        this.$web3.eth.subscribe('newBlockHeaders')
        .on('data', block => {
          loadData()
        })

        this.$web3.eth.subscribe('syncing')
        .on('data', sync => {
          loadData()
        })

        loadData()
      },
      async loadData() {
        let blockNumber = await this.$web3.eth.getBlockNumber()
        this.blockNumber = blockNumber.toLocaleString()
        let isSyncing = await this.$web3.eth.isSyncing()

        if (isSyncing !== false) {
          if (this.startingBlock == 0) {
            this.startingBlock = isSyncing.currentBlock
          }

          if (isSyncing.highestBlock == 0) {
            this.syncTotal = 1
            this.syncProgress = 0
          }
          else {
            let startingBlock = isSyncing.startingBlock ? isSyncing.startingBlock : this.startingBlock
            this.syncTotal = isSyncing.highestBlock - startingBlock
            this.syncProgress = isSyncing.currentBlock - startingBlock
          }

          this.isSyncing = true
        }
        else {
          this.isSyncing = false
        }

        this.peerCount = await this.$web3.eth.net.getPeerCount()
        let ipfsId = await this.$http.get('http://127.0.0.1:5001/api/v0/id')
        this.ipfsAgent = ipfsId.data.AgentVersion
        this.ipfsProtocol = ipfsId.data.ProtocolVersion

        let addresses = []
        for (let address of ipfsId.data.Addresses) {
          addresses.push(address.split('/ipfs/')[0])
        }
        this.ipfsAddresses = addresses;

        let peers = await this.$http.get('http://127.0.0.1:5001/api/v0/swarm/peers')
        this.ipfsPeerCount = peers.data.Peers.length
      }
    },
    async created() {
      try {
        await this.$web3.eth.getProtocolVersion()
        this.start()
      }
      catch (e) {
        this.downloadingParity = true
        ipcRenderer.on('parity-download-progress', (event, progress) => {
          this.parityDownloadProgress = progress * 1000
        })

        ipcRenderer.on('parity-running', async (event) => {
          this.start()
        })
      }
    },
  }
</script>
