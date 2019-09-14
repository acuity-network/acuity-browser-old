<template>
  <page>
    <template slot="title">
      {{ $t('NodeStatus.NodeStatus') }}
    </template>

    <template slot="body">
      <b-field :label="$t('NodeStatus.AcuityVersion')">
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
            {{ blockNumber }}
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

<script>
  import { remote } from 'electron'
  import Page from './Page.vue'
  import throttle from 'just-throttle'
  import { ipcRenderer } from 'electron'
  import formatByteCount from '../../lib/formatByteCount.js'
  import setTitle from '../../lib/setTitle.js'

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
      async loadMixData() {
        let blockNumber = await this.$mixClient.web3.eth.getBlockNumber()
        this.blockNumber = blockNumber.toLocaleString()
        this.peerCount = await this.$mixClient.web3.eth.net.getPeerCount()
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
      setTitle(this.$t('nodeStatus'))
      if (process.env.NODE_ENV == 'development') {
        this.acuityVersion = process.env.npm_package_version
      }
      else {
        this.acuityVersion = remote.app.getVersion()
      }
      this.agent = (await this.$mixClient.web3.eth.getNodeInfo()).split('-stable-')[0]
      this.web3Version = this.$mixClient.web3.version
      let protocolVersion = await this.$mixClient.web3.eth.getProtocolVersion()
      this.protocolVersion = this.$mixClient.web3.utils.hexToNumber(protocolVersion)
      this.networkId = await this.$mixClient.web3.eth.net.getId()

      let loadMixData = throttle(this.loadMixData, 500, true)

      this.newBlockHeadersEmitter = this.$mixClient.web3.eth.subscribe('newBlockHeaders')
      .on('data', block => {
        loadMixData()
      })

      loadMixData()
      this.ipfsInterval = setInterval(this.loadIpfsData, 10000)
      this.loadIpfsData()
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
