<template>
  <page>
    <template slot="title">
      {{ $t('nodeStatus') }}
    </template>

    <template slot="body">
      <div class="columns">
        <div class="column">
          <h2 class="subtitle">{{ $t('mixBlockchain') }}</h2>
          <div v-if="downloadingParity === true">
            <b-field label="Parity downloading">
              <progress-bar size="tiny" :val="parityDownloadProgress" max="1000" bar-transition="none" />
            </b-field>
          </div>
          <div v-if="downloadingParity === false">
            <b-field :label="$t('web3Version')">
              {{ web3Version }}
            </b-field>
            <b-field :label="$t('protocolVersion')">
              {{ protocolVersion }}
            </b-field>
            <b-field :label="$t('networkId')">
              {{ networkId }}
            </b-field>
            <b-field :label="$t('blockNumber')">
              {{ blockNumber }}
            </b-field>
            <b-field :label="$t('peerCount')">
              {{ peerCount }}
            </b-field>
            <b-field :label="$t('catchingUp')">
              <div v-if="isSyncing">
                <progress-bar size="tiny" :val="syncProgress" :max="syncTotal" bar-transition="none" />
              </div>
              <div v-else>
                no
              </div>
            </b-field>
            <b-field :label="$t('clockSync')">
              <span v-if="isClockSync">yes</span>
              <span v-else>no</span>
            </b-field>
            <b-field :label="$t('timeDrift')">
              {{ timeDrift }} ms
            </b-field>
          </div>
        </div>
        <div class="column">
          <h2 class="subtitle">IPFS</h2>
          <b-field :label="$t('agent')">
            {{ ipfsAgent }}
          </b-field>
          <b-field :label="$t('protocol')">
            {{ ipfsProtocol }}
          </b-field>
          <b-field :label="$t('addresses')">
            <ul>
              <li v-for="address in ipfsAddresses">
                {{ address }}
              </li>
            </ul>
          </b-field>
          <b-field :label="$t('peerCount')">
            {{ ipfsPeerCount }}
          </b-field>
          <b-field :label="$t('repoSize')">
            {{ ipfsRepoSize }}
          </b-field>
          <b-field :label="$t('repoObjectCount')">
            {{ ipfsRepoObjectCount }}
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

  function formatByteCount(bytes, digits = 2) {
    if (bytes == 0) return '0 B'
    let units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    let i = Math.floor(Math.log(bytes) / Math.log(1000))
    return (bytes / Math.pow(1000, i)).toFixed(digits) + ' ' + units[i]
  }

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
        ipfsRepoSize: '',
        ipfsRepoObjectCount: '',
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

        let loadMixData = throttle(this.loadMixData, 500, true)

        this.newBlockHeadersEmitter = this.$web3.eth.subscribe('newBlockHeaders')
        .on('data', block => {
          loadMixData()
        })

        this.syncingEmitter = this.$web3.eth.subscribe('syncing')
        .on('data', sync => {
          loadMixData()
        })

        loadMixData()
        this.ipfsInterval = setInterval(this.loadIpfsData, 10000)
        this.loadIpfsData()
      },
      async loadMixData() {
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
      },
      async loadIpfsData() {
        try {
          let ipfsId = await this.$ipfsClient.get('id')
          this.ipfsAgent = ipfsId.AgentVersion
          this.ipfsProtocol = ipfsId.ProtocolVersion

          let addresses = []
          for (let address of ipfsId.Addresses) {
            addresses.push(address.split('/ipfs/')[0])
          }
          this.ipfsAddresses = addresses.sort();

          let peers = await this.$ipfsClient.get('swarm/peers')
          this.ipfsPeerCount = (peers.Peers === null) ? 0 : peers.Peers.length

          let repoStat = await this.$ipfsClient.get('repo/stat')
          this.ipfsRepoSize = formatByteCount(repoStat.RepoSize)
          this.ipfsRepoObjectCount = repoStat.NumObjects
        }
        catch (e) {
          setTimeout(this.loadIpfsData, 500)
        }
      },
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
    destroyed() {
      this.newBlockHeadersEmitter.unsubscribe()
      this.syncingEmitter.unsubscribe()
      clearInterval(this.ipfsInterval)
    },
  }
</script>
