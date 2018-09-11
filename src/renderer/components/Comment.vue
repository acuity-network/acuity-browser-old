<template>
  <div class="blog-post">
    <div class="avatar" v-html="avatar"></div>
    <div v-html="bodyText"></div>
  </div>
</template>

<script>
  import MixItem from '../../lib/MixItem.js'

  export default {
    name: 'comment',
    props: ['itemId'],
    data() {
      return {
        avatar: '',
        bodyText: '',
      }
    },
    created () {
      var item = new MixItem(this.$root, this.itemId)

      item.init()
      .then(item => {

        item.account()
        .then(account => {
          return account.call(this.$accountProfile.methods.getProfile())
        })
        .then(itemId => {
          var profile = new MixItem(this.$root, itemId)

          profile.init()
          .then(profile => {
            return profile.latestRevision().load()
          })
          .then(revision => {
            this.avatar = revision.getImage(32, 32)
          })
        })
        .catch(() => {})

        item.latestRevision().load()
        .then(revision => {
          this.bodyText = revision.getBodyText()
        })
      })
    },
  }

</script>

<style>

  .avatar img {
    margin-right: 10px;
    object-fit: cover;
    width: 32px;
    height: 32px;
  }

  .blog-post {
    margin: 10px;
  }

</style>
