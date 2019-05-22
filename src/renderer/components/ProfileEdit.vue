<template>
  <page>
    <template slot="title">
      {{ $t('editProfile') }}
    </template>

    <template slot="body">
      <b-field :label="$t('name')">
        <b-input v-model="name"></b-input>
      </b-field>

      <b-field :label="$t('accountType')">
        <b-select v-model="type">
          <option value="0">Anon</option>
          <option value="1">Person</option>
          <option value="2">Project</option>
          <option value="3">Organization</option>
          <option value="4">Proxy</option>
          <option value="5">Parody</option>
          <option value="6">Bot</option>
          <option value="7">Shill</option>
        </b-select>
      </b-field>

      <b-field :label="$t('location')">
        <b-input v-model="location"></b-input>
      </b-field>

      <b-field :label="$t('bio')">
        <b-input v-model="bio" type="textarea"></b-input>
      </b-field>

      <b-field label="Image" :message="filepath">
        <button class="button" @click="chooseFile">{{ $t('chooseImage') }}</button>
      </b-field>

      <button class="button is-primary" @click="publish">{{ $t('publish') }}</button>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import itemProto from '../../lib/protobuf/item_pb.js'
  import profileProto from '../../lib/protobuf/account-profile_pb.js'
  import titleProto from '../../lib/protobuf/title_pb.js'
  import bodyTextProto from '../../lib/protobuf/body_pb.js'
  import languageProto from '../../lib/protobuf/language_pb.js'
  import multihash from 'multihashes'
  import MixItem from '../../lib/MixItem.js'
  import Image from '../../lib/Image.js'
  import MixContent from '../../lib/MixContent.js'

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
      if (!window.activeAccount) {
        return
      }
      delete window.fileNames
      let itemId = await window.activeAccount.getProfile()
      let item = await new MixItem(this, itemId).init()
      let revision = await item.latestRevision().load()
      this.name = revision.getTitle()
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
          title: 'Choose image',
          filters: [{name: 'Images', extensions: ['webp', 'jpg', 'jpeg', 'png', 'gif', 'tiff', 'svg', 'svgz', 'ppm']}],
        }, (fileNames) => {
          this.filepath = fileNames[0]
        })
      },
      async publish(event) {
        let content = new MixContent(this.$root)

        // Account profile
        let profileMessage = new profileProto.AccountProfile()
        profileMessage.setType(this.type)
        profileMessage.setLocation(this.location)
        content.addMixin(0x4bf3ce07, profileMessage.serializeBinary())

        // Language
        let languageMessage = new languageProto.LanguageMixin()
        languageMessage.setLanguageTag('en-US')
        content.addMixin(0x4e4e06c4, languageMessage.serializeBinary())

        // Title
        let titleMessage = new titleProto.TitleMixin()
        titleMessage.setTitle(this.name)
        content.addMixin(0x24da6114, titleMessage.serializeBinary())

        // BodyText
        let bodyTextMessage = new bodyTextProto.BodyTextMixin()
        bodyTextMessage.setBodyText(this.bio)
        content.addMixin(0x34a9a6ec, bodyTextMessage.serializeBinary())

        // Image
        if (this.filepath != '') {
          let image = new Image(this.$root, this.filepath)
          content.addMixin(0x12745469, await image.createMixin())
        }

        let ipfsHash = await content.save()
        try {
          let itemId = await window.activeAccount.call(this.$accountProfile, 'getProfile')
          await window.activeAccount.sendData(this.$itemStoreIpfsSha256, 'createNewRevision', [itemId, ipfsHash], 0, 'Update profile')
        }
        catch(e) {
          let flagsNonce = '0x01' + this.$web3.utils.randomHex(31).substr(2)
          let itemId = await window.activeAccount.call(this.$itemStoreIpfsSha256, 'getNewItemId', [window.activeAccount.contractAddress, flagsNonce])
          await window.activeAccount.sendData(this.$itemStoreIpfsSha256, 'create', [flagsNonce, ipfsHash], 0, 'Create profile item')
          await window.activeAccount.sendData(this.$accountProfile, 'setProfile', [itemId], 0, 'Set profile item')
        }

        this.$root.$emit('change-active-account', window.activeAccount)
        this.$router.push({ name: 'profile' })
      }
    }
  }
</script>
