<template>
  <div class="is-clearfix">
    <div v-html="image" class="avatar"></div>
    {{ title }}
    <span v-if="unlocked" class="clickable mdi mdi-12px mdi-lock-open" style="color: #228B22;" @click="lock"></span>
    <span v-else class="clickable mdi mdi-12px mdi-lock" style="color: #CE2029;" @click="passwordFieldType = ''; password = ''; enterPassword = !enterPassword"></span>
    <b-field v-if="enterPassword" :type="passwordFieldType">
      <b-input type="password" v-model="password" password-reveal @keydown.native.enter="unlock"></b-input>
    </b-field>
  </div>
</template>

<script lang="ts">
  import MixItem from '../../lib/MixItem'

  export default {
    name: 'active-account',
    data() {
      return {
        title: '',
        image: '',
        unlocked: false,
        enterPassword: false,
        passwordFieldType: '',
        password: '',
      }
    },
    methods: {
      async loadData() {
        this.unlocked = this.$activeAccount.get().isUnlocked()
        try {
          let itemId = await this.$activeAccount.get().call(this.$mixClient.accountProfile, 'getProfile')
          let item: MixItem = await new MixItem(this, itemId).init()
          let revision = await item.latestRevision().load()
          this.title = revision.getTitle()
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
        this.loadData()
      },
    },
    created() {
      this.$root.$on('change-active-account', this.changeActiveAccount)
      this.loadData()
    },
    destroyed() {
      this.$root.$off('change-active-account', this.changeActiveAccount)
    },
  }
</script>

<style scoped>
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
