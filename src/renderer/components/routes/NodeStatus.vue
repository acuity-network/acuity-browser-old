<template>
  <page>
    <template slot="title">
      {{ $t('NodeStatus.NodeStatus') }}
    </template>

    <template slot="body">
      <b-field v-show="false" :label="$t('NodeStatus.AcuityVersion')">
        {{ acuityVersion }}
      </b-field>
      <div class="columns">
        <div class="column">
          <h2 class="subtitle">{{ $t('NodeStatus.MixBlockchain') }}</h2>
          <b-field :label="$t('NodeStatus.Agent')">
            {{ agent }}
          </b-field>
          <b-field :label="$t('NodeStatus.Web3Version')">
            {{ web3Version }}
          </b-field>
          <b-field :label="$t('NodeStatus.ProtocolVersion')">
            {{ protocolVersion }}
          </b-field>
          <b-field :label="$t('NodeStatus.NetworkId')">
            {{ networkId }}
          </b-field>
          <b-field :label="$t('NodeStatus.BlockNumber')">
            {{ blockNumber }} (<timeago :datetime="blockTimestamp" :autoUpdate="true"></timeago>)
          </b-field>
          <b-field :label="$t('NodeStatus.PeerCount')">
            {{ peerCount }}
          </b-field>
        </div>
        <div class="column">
          <h2 class="subtitle">IPFS</h2>
          <b-field :label="$t('NodeStatus.Agent')">
            {{ ipfsAgent }}
          </b-field>
          <b-field :label="$t('NodeStatus.Protocol')">
            {{ ipfsProtocol }}
          </b-field>
          <b-field :label="$t('NodeStatus.Addresses')">
            <ul>
              <li v-for="address in ipfsAddresses">
                {{ address }}
              </li>
            </ul>
          </b-field>
          <b-field :label="$t('NodeStatus.PeerCount')">
            {{ ipfsPeerCount }}
          </b-field>
          <b-field :label="$t('NodeStatus.RepoSize')">
            {{ ipfsRepoSize }}
          </b-field>
          <b-field :label="$t('NodeStatus.RepoObjectCount')">
            {{ ipfsRepoObjectCount }}
          </b-field>
        </div>
      </div>
    </template>
  </page>
</template>

<script lang="ts">
//  import { remote } from 'electron'
  import Page from '../Page.vue'
  import throttle from 'just-throttle'
  import formatByteCount from '../../../lib/formatByteCount'
  import setTitle from '../../../lib/setTitle'

  export default {
    name: 'node-status',
    components: {
      Page,
    },
    data() {
      return {
        acuityVersion: '',
        agent: '',
        web3Version: '',
        protocolVersion: '',
        networkId: '',
        blockNumber: '',
        blockTimestamp: null,
        peerCount: '',
        ipfsAgent: '',
        ipfsProtocol: '',
        ipfsAddresses: [],
        ipfsPeerCount: '',
        ipfsRepoSize: '',
        ipfsRepoObjectCount: '',
      }
    },
    methods: {
      async loadBlockData() {
        let blockNumber = await this.$mixClient.web3.eth.getBlockNumber()
        this.blockNumber = blockNumber.toLocaleString()
        let block = await this.$mixClient.web3.eth.getBlock(blockNumber)
        this.blockTimestamp = new Date(block.timestamp * 1000)
      },
      async loadPeriodicData() {
          this.peerCount = await this.$mixClient.web3.eth.net.getPeerCount()

          let ipfsId = await this.$ipfsClient.id()
          let addresses = []
          for (let address of ipfsId.addresses) {
            addresses.push(address.split('/ipfs/')[0])
          }
          this.ipfsAddresses = addresses.sort();

          let peers = await this.$ipfsClient.peers()
          this.ipfsPeerCount = peers ? peers.length : 0

          let repoStat = await this.$ipfsClient.repoStat()
          this.ipfsRepoSize = formatByteCount(repoStat.repoSize)
          this.ipfsRepoObjectCount = repoStat.numObjects.toLocaleString()
      },
    },
    async created() {
      setTitle(this.$t('NodeStatus.NodeStatus'))
/*
      if (process.env.NODE_ENV == 'development') {
        this.acuityVersion = process.env.npm_package_version
      }
      else {
        this.acuityVersion = remote.app.getVersion()
      }
*/
      this.agent = (await this.$mixClient.web3.eth.getNodeInfo()).split('-stable-')[0]
      this.web3Version = this.$mixClient.web3.version
      let protocolVersion = await this.$mixClient.web3.eth.getProtocolVersion()
      this.protocolVersion = this.$mixClient.web3.utils.hexToNumber(protocolVersion)
      this.networkId = await this.$mixClient.web3.eth.net.getId()

      let ipfsId = await this.$ipfsClient.id()
      this.ipfsAgent = ipfsId.agentVersion
      this.ipfsProtocol = ipfsId.protocolVersion

      let loadBlockData = throttle(this.loadBlockData, 500, true)
      this.newBlockHeadersEmitter = this.$mixClient.web3.eth.subscribe('newBlockHeaders')
      .on('data', block => {
        loadBlockData()
      })
      loadBlockData()

      this.ipfsInterval = setInterval(this.loadPeriodicData, 10000)
      this.loadPeriodicData()
    },
    destroyed() {
      this.newBlockHeadersEmitter.unsubscribe()
      clearInterval(this.ipfsInterval)
    },
  }
</script>


<style scoped>

  .field >>> .label:not(:last-child) {
    margin-bottom: 0;
  }

</style>
