<template>
  <page>
    <template slot="title">
      {{ title }}
    </template>

    <template slot="body">
      <ul>
        <li><router-link to="/profile/edit">Edit profile</router-link></li>
      </ul>
      <div class="avatar" v-html="image"></div>
      <b-field label="Account type">
        {{ type }}
      </b-field>
      <b-field label="Bio">
        {{ bio }}
      </b-field>
      <b-field label="Location">
        {{ location }}
      </b-field>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import MixItem from '../../lib/MixItem.js'

  export default {
    name: 'profile',
    components: {
      Page,
    },
    data() {
      return {
        title: '',
        bio: '',
        image: '',
        location: '',
        type: '',
      }
    },
    created() {
      if (!window.activeAccount) {
        return
      }
      window.activeAccount.call(this.$accountProfile.methods.getProfile())
      .then(itemId => {
        var item = new MixItem(this, itemId)

        item.init()
        .then(item => {
          return item.latestRevision().load()
        })
        .then(revision => {
          this.title = revision.getTitle()
          this.bio = revision.getBodyText()
          this.image = revision.getImage(256)
          var profile = revision.getProfile()
          this.location = profile.location

          switch (profile.type) {
            case 0:
              this.type = 'Anon'
              break

            case 1:
              this.type = 'Person'
              break

            case 2:
              this.type = 'Project'
              break

            case 3:
              this.type = 'Organization'
              break

            case 4:
              this.type = 'Proxy'
              break

            case 5:
              this.type = 'Parody'
              break

            case 6:
              this.type = 'Bot'
              break

            case 7:
              this.type = 'Shill'
              break
          }
        })
      })
      .catch(error => {
        console.log(error)
      })
    },
  }
</script>

<style scoped>
  .avatar {
    width: 256px;
  }
</style>
