<template>
  <page>
    <template slot="title">
      {{ $t('ProfileEdit.EditProfile') }}
    </template>

    <template slot="body">
      <b-field :label="$t('ProfileEdit.Name')">
        <b-input v-model="name"></b-input>
      </b-field>

      <b-field :label="$t('ProfileEdit.AccountType')">
        <b-select v-model="type">
          <option value="0">{{ $t('ProfileEdit.Anon') }}</option>
          <option value="1">{{ $t('ProfileEdit.Person') }}</option>
          <option value="2">{{ $t('ProfileEdit.Project') }}</option>
          <option value="3">{{ $t('ProfileEdit.Organization') }}</option>
          <option value="4">{{ $t('ProfileEdit.Proxy') }}</option>
          <option value="5">{{ $t('ProfileEdit.Parody') }}</option>
          <option value="6">{{ $t('ProfileEdit.Bot') }}</option>
          <option value="7">{{ $t('ProfileEdit.Shill') }}</option>
          <option value="8">{{ $t('ProfileEdit.Test') }}</option>
        </b-select>
      </b-field>

      <b-field :label="$t('ProfileEdit.Location')">
        <b-input v-model="location"></b-input>
      </b-field>

      <b-field :label="$t('ProfileEdit.Bio')">
        <b-input v-model="bio" type="textarea"></b-input>
      </b-field>

      <b-field label="Image" :message="filepath">
        <button class="button" @click="chooseFile">{{ $t('ProfileEdit.ChooseImage') }}</button>
      </b-field>

      <button class="button is-primary" @click="publish">{{ $t('ProfileEdit.Publish') }}</button>
    </template>
  </page>
</template>

<script lang="ts">
  import Page from './Page.vue'
  import ProfileMixinProto from '../../lib/protobuf/ProfileMixin_pb.js'
  import TitleMixinProto from '../../lib/protobuf/TitleMixin_pb.js'
  import BodyTextMixinProto from '../../lib/protobuf/BodyTextMixin_pb.js'
  import LanguageMixinProto from '../../lib/protobuf/LanguageMixin_pb.js'
  import MixItem from '../../lib/MixItem.js'
  import Image from '../../lib/Image.js'
  import MixContent from '../../lib/MixContent.js'
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'profile',
    components: {
      Page,
    },
    data() {
      return {
        name: '',
        bio: '',
        location: '',
        type: '',
        filepath: '',
      }
    },
    async created() {
      if (!this.$activeAccount.get()) {
        return
      }
      let itemId = await this.$activeAccount.get().getProfile()
      let item = await new MixItem(this, itemId).init()
      let revision = await item.latestRevision().load()
      this.name = revision.getTitle()
      setTitle(this.name)
      this.bio = revision.getBodyText()
      this.image = revision.getImage(256)
      let profile = revision.getProfile()
      this.type = profile.type
      this.location = profile.location
    },
    methods: {
      chooseFile(event) {
        let {dialog} = require('electron').remote
        dialog.showOpenDialog({
          title: this.$t('ProfileEdit.ChooseImage'),
          filters: [{name: this.$t('ProfileEdit.Images'), extensions: ['webp', 'jpg', 'jpeg', 'png', 'gif', 'tiff', 'svg', 'svgz', 'ppm']}],
        }, (fileNames) => {
          this.filepath = fileNames[0]
        })
      },
      async publish(event) {
        let content = new MixContent(this.$root)

        // Account profile
        let profileMessage = new ProfileMixinProto.ProfileMixin()
        profileMessage.setType(this.type)
        profileMessage.setLocation(this.location)
        content.addMixinPayload(0xbeef2144, profileMessage.serializeBinary())

        // Language
        let languageMessage = new LanguageMixinProto.LanguageMixin()
        languageMessage.setLanguageTag(this.$settings.get('locale'))
        content.addMixinPayload(0x9bc7a0e6, languageMessage.serializeBinary())

        // Title
        let titleMessage = new TitleMixinProto.TitleMixin()
        titleMessage.setTitle(this.name)
        content.addMixinPayload(0x344f4812, titleMessage.serializeBinary())

        // BodyText
        let bodyTextMessage = new BodyTextMixinProto.BodyTextMixin()
        bodyTextMessage.setBodyText(this.bio)
        content.addMixinPayload(0x2d382044, bodyTextMessage.serializeBinary())

        // Image
        if (this.filepath != '') {
          let image = new Image(this.$root, this.filepath)
          content.addMixinPayload(0x045eee8c, await image.createMixin())
        }

        let ipfsHash = await content.save()
        try {
          let itemId = await this.$activeAccount.get().call(this.$mixClient.accountProfile, 'getProfile')
          await this.$activeAccount.get().sendData(this.$mixClient.itemStoreIpfsSha256, 'createNewRevision', [itemId, ipfsHash], 0, 'Update profile')
        }
        catch(e) {
          let flagsNonce = '0x01' + this.$mixClient.web3.utils.randomHex(31).substr(2)
          let itemId = await this.$activeAccount.get().call(this.$mixClient.itemStoreIpfsSha256, 'getNewItemId', [this.$activeAccount.get().contractAddress, flagsNonce])
          await this.$activeAccount.get().sendData(this.$mixClient.itemStoreIpfsSha256, 'create', [flagsNonce, ipfsHash], 0, 'Create profile item')
          await this.$activeAccount.get().sendData(this.$mixClient.accountProfile, 'setProfile', [itemId], 0, 'Set profile item')
        }

        this.$root.$emit('change-active-account', this.$activeAccount.get())
        this.$router.push({ name: 'profile' })
      }
    }
  }
</script>
