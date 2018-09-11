<template>
  <div id="active-account" class="is-clearfix">
    <div v-html="image" class="is-pulled-left"></div>
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
          var itemId = await window.activeAccount.call(this.$accountProfile.methods.getProfile())
          var item = await new MixItem(this, itemId).init()
          var revision = await item.latestRevision().load()
          this.title = revision.getTitle()
          this.image = revision.getImage(64, 64)
        }
        catch (error) {
          this.title = ''
          this.image = ''
        }
      }
    },
    created() {
      this.$root.$on('change-active-account', accountAddress => {
        this.loadData()
      })
      this.loadData()
    },
  }
</script>

<style>
  #active-account img {
    margin-right: 10px;
    object-fit: cover;
    width: 64px;
    height: 64px;
  }
</style>
