<template>
  <page>
    <template slot="title">
      {{ title }}
      <span @click="copyItemId" class="clickable mdi mdi-24px mdi-link"></span>
    </template>

    <template slot="body">
      <ul>
        <li><router-link to="/profile/edit">{{ $t('Profile.EditProfile') }}</router-link></li>
      </ul>
      <div class="avatar" v-html="image"></div>
      <b-field :label="$t('Profile.AccountType')">
        {{ type }}
      </b-field>
      <b-field :label="$t('Profile.Bio')">
        {{ bio }}
      </b-field>
      <b-field :label="$t('Profile.Location')">
        {{ location }}
      </b-field>
    </template>
  </page>
</template>

<script lang="ts">
  import { clipboard } from 'electron'
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
        itemId: '',
        title: '',
        bio: '',
        image: '',
        location: '',
        type: '',
      }
    },
    async created() {
      if (!this.$activeAccount.get()) {
        return
      }
      this.itemId = await this.$activeAccount.get().getProfile()
      let item = await new MixItem(this, this.itemId).init()
      let revision = await item.latestRevision().load()
      this.title = revision.getTitle()
      setTitle(this.title)
      this.bio = revision.getBodyText()
      this.image = revision.getImage(256)
      let profile = revision.getProfile()
      this.location = profile.location

      switch (profile.type) {
        case 0:
          this.type = this.$t('Profile.Anon')
          break

        case 1:
          this.type = this.$t('Profile.Person')
          break

        case 2:
          this.type = this.$t('Profile.Project')
          break

        case 3:
          this.type = this.$t('Profile.Organization')
          break

        case 4:
          this.type = this.$t('Profile.Proxy')
          break

        case 5:
          this.type = this.$t('Profile.Parody')
          break

        case 6:
          this.type = this.$t('Profile.Bot')
          break

        case 7:
          this.type = this.$t('Profile.Shill')
          break

        case 8:
          this.type = this.$t('Profile.Test')
          break
      }
    },
    methods: {
      async copyItemId(event) {
        clipboard.writeText(this.itemId)
        this.$buefy.toast.open(this.$t('Profile.ItemIdCopied'))
      },
    },
  }
</script>

<style scoped>
  .clickable {
    cursor: pointer;
    user-select: none;
  }

  .avatar {
    width: 256px;
  }
</style>
