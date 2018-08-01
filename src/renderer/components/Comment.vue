<template>
  <div class="blog-post">
    <span v-html="bodyText"></span>
  </div>
</template>

<script>
  import MixItem from '../../lib/MixItem.js'

  export default {
    name: 'comment',
    props: ['itemId'],
    data() {
      return {
        bodyText: '',
      }
    },
    created () {
      var item = new MixItem(this.$root, this.itemId)

      return item.init()
      .then(item => {
        return item.latestRevision().load()
      })
      .then(revision => {
        this.bodyText = revision.getBodyText()
      })
    },
  }

</script>

<style>

.blog-post {
  margin: 10px;
}

</style>
