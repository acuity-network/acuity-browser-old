<template>
  <div id="active-account" class="is-clearfix">
    <div class="avatar">
      <ipfs-image :ipfsHash="image" :key="image"></ipfs-image>
    </div>
    <profile-link :address="address"></profile-link>
    <span v-if="unlocked" class="clickable mdi mdi-12px mdi-lock-open" style="color: #228B22;" @click="lock"></span>
    <span v-else class="clickable mdi mdi-12px mdi-lock" style="color: #CE2029;" @click="passwordFieldType = ''; password = ''; enterPassword = !enterPassword"></span>
    <b-field v-if="enterPassword" :type="passwordFieldType">
      <b-input type="password" v-model="password" password-reveal @keydown.native.enter="unlock"></b-input>
    </b-field>
    <div>{{ balance }} MIX</div>
  </div>
</template>

<script lang="ts">
  import MixItem from '../../lib/MixItem'
  import ProfileLink from './ProfileLink.vue'
  import IpfsImage from './IpfsImage.vue'

  export default {
    name: 'active-account',
    components: {
      ProfileLink,
      IpfsImage,
    },
    data() {
      return {
        address: '',
        image: '',
        unlocked: false,
        enterPassword: false,
        passwordFieldType: '',
        password: '',
        balance: '',
      }
    },
    methods: {
      async loadData() {
        this.unlocked = this.$activeAccount.get().isUnlocked()
        try {
          this.address = await this.$activeAccount.get().contractAddress
          this.balance = this.$mixClient.formatWei(await this.$activeAccount.get().getBalance())
          let itemId = await this.$activeAccount.get().call(this.$mixClient.accountProfile, 'getProfile')
          let item: MixItem = await new MixItem(this, itemId).init()
          let revision = await item.latestRevision().load()
          this.image = revision.getImage(100, 100)
        }
        catch (error) {
          this.title = ''
          this.image = ''
        }
      },
      async unlock() {
        try {
          await this.$activeAccount.get().unlock(this.password)
        }
        catch (e) {
          this.passwordFieldType = 'is-danger'
          return
        }
        this.enterPassword = false
        this.password = ''
        this.loadData()
      },
      lock() {
        this.$activeAccount.get().lock()
        this.loadData()
      },
      changeActiveAccount() {
        this.address = ''
        this.loadData()
      },
    },
    created() {
      this.$root.$on('change-active-account', this.changeActiveAccount)
      this.newBlockHeadersEmitter = this.$mixClient.web3.eth.subscribe('newBlockHeaders')
      .on('data', block => {
        this.loadData()
      })
      this.loadData()
    },
    destroyed() {
      this.$root.$off('change-active-account', this.changeActiveAccount)
      this.newBlockHeadersEmitter.unsubscribe()
    },
  }
</script>

<style scoped>

  #active-account >>> .router-link-active {
    color: #3273dc;
    background-color: rgb(32,32,32);
  }

  .clickable {
    cursor: pointer;
    user-select: none;
  }

  .avatar {
    margin-right: 10px;
  }

  .avatar >>> img {
    object-fit: cover;
    width: 100px;
    height: 100px;
  }

</style>
