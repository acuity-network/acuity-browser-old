<template>
  <page>
    <template slot="title">
      {{ title }}
    </template>

    <template slot="body">
      <ul>
        <li><router-link to="/profile/edit">{{ $t('editProfile') }}</router-link></li>
      </ul>
      <div class="avatar" v-html="image"></div>
      <b-field :label="$t('accountType')">
        {{ type }}
      </b-field>
      <b-field :label="$t('bio')">
        {{ bio }}
      </b-field>
      <b-field :label="$t('location')">
        {{ location }}
      </b-field>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import MixItem from '../../lib/MixItem.js'
  import setTitle from '../../lib/setTitle.js'

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
    async created() {
      if (!window.activeAccount) {
        return
      }
      let itemId = await window.activeAccount.getProfile()
      let item = await new MixItem(this, itemId).init()
      let revision = await item.latestRevision().load()
      this.title = revision.getTitle()
      setTitle(this.title)
      this.bio = revision.getBodyText()
      this.image = revision.getImage(256)
      let profile = revision.getProfile()
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

        case 7:
          this.type = 'Test'
          break
      }
    }
  }
</script>

<style scoped>
  .avatar {
    width: 256px;
  }
</style>
