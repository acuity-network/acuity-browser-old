<template>
  <div class="is-clearfix">
    <div v-html="image" class="avatar"></div>
    {{ title }}
  </div>
</template>

<script>
  import MixItem from '../../lib/MixItem.js'

  export default {
    name: 'active-account',
    data() {
      return {
        title: '',
        image: '',
      }
    },
    methods: {
      async loadData() {
        try {
          var itemId = await window.activeAccount.call(this.$accountProfile, 'getProfile')
          var item = await new MixItem(this, itemId).init()
          var revision = await item.latestRevision().load()
          this.title = revision.getTitle()
          this.image = revision.getImage(64, 64)
        }
        catch (error) {
          this.title = ''
          this.image = ''
        }
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

  .avatar {
    margin-right: 10px;
  }

  .avatar >>> img {
    object-fit: cover;
    width: 64px;
    height: 64px;
  }

</style>
