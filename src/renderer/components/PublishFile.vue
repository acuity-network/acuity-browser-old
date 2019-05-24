<template>
  <page>
    <template slot="title">
      {{ $t('publishFile') }}
    </template>

    <template slot="body">
      <b-field label="Title">
        <b-input v-model="title"></b-input>
      </b-field>

      <b-field label="Description">
        <b-input v-model="description" type="textarea"></b-input>
      </b-field>

      <b-field label="Feed">
        <b-select v-model="feedId" placeholder="Select a feed">
          <option
            v-for="feed in feeds"
            :value="feed.itemId"
            :key="feed.itemId">
            {{ feed.title }}
          </option>
        </b-select>
      </b-field>

      <b-field label="File" :message="filepath">
        <button class="button" @click="chooseFile">{{ $t('chooseFile') }}</button>
      </b-field>
      <code id="output" style="display: block; font-size:small"></code>
      <button v-if="isDoneUploading" class="button is-primary" @click="publish">{{ $t('publish') }}</button>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import languageProto from '../../lib/protobuf/language_pb.js'
  import titleProto from '../../lib/protobuf/title_pb.js'
  import bodyTextProto from '../../lib/protobuf/body_pb.js'
  import descriptionProto from '../../lib/protobuf/description_pb.js'
  import fileProto from '../../lib/protobuf/file_pb.js'
  import MixItem from '../../lib/MixItem.js'
  import MixContent from '../../lib/MixContent.js'
  import fs from 'fs-extra'
  import request from 'request'
  import File from '../../lib/File.js'
  import formatByteCount from '../../lib/formatByteCount.js'
  import Base58 from 'base-58'

  export default {
    name: 'publish-file',
    components: {
      Page,
    },
    data() {
      return {
            title: '',
            description: '',
            feeds: [{itemId: '0', title: 'none'}],
            feedId: '0',
            filepath: '',
            fileTotalSize: 0,
            isUploading: false,
            isDoneUploading: false,
            fileHash:'',
            fileName:'',
            fileSize:''
        }
    },
    created() {
      delete window.fileNames
      this.$db.createValueStream({
        'gte': '/accountFeeds/' + window.activeAccount.contractAddress + '/',
        'lt': '/accountFeeds/' + window.activeAccount.contractAddress + '/z',
      })
      .on('data', async itemId => {
        try {
          let item = await new MixItem(this.$root, itemId).init()
          let revision = await item.latestRevision().load()

          this.feeds.push({
            itemId: itemId,
            title: revision.getTitle(),
          })
        }
        catch (e) {}
      })
    },
    methods: {
      chooseFile(event) {
        const {dialog} = require('electron').remote
        dialog.showOpenDialog({
          title: 'Choose File',
          //filters: [{name: 'Files', extensions: ['webp', 'jpg', 'jpeg', 'png', 'gif', 'tiff', 'svg', 'svgz', 'ppm']}],
        }, (fileNames) => {
            this.isUploading = true;
            this.fileUploadedSize = 0;
            this.filePath = fileNames[0];
            let stats = fs.statSync(fileNames[0])
            this.fileTotalSize = stats.size;
            output.innerHTML = 'Uploading file...'
            let req = request.post('http://127.0.0.1:5001/api/v0/add', (err, res, body) => {
                if (err) {
                    console.log(err);
                } else {      
                    let jsonBody = JSON.parse(body);
                    this.fileHash = jsonBody.Hash;
                    this.fileName = jsonBody.Name;
                    this.fileSize = jsonBody.Size;
                    this.isDoneUploading = true;
                    output.innerHTML = 'Name: '+ this.fileName + '<br/>' + 'Hash: '+ this.fileHash + '<br/>' + 'Size: ' +  formatByteCount(this.fileSize)
                }
            });
            let form = req.form();
            form.append('file', fs.createReadStream(fileNames[0]));
        })
      },
      async publish(event) {
        let flagsNonce = '0x0f' + this.$web3.utils.randomHex(31).substr(2)
        let itemId = await window.activeAccount.call(this.$itemStoreIpfsSha256, 'getNewItemId', [window.activeAccount.contractAddress, flagsNonce])
        let content = new MixContent(this.$root)

        // Language
        let languageMessage = new languageProto.LanguageMixin()
        languageMessage.setLanguageTag('en-US')
        content.addMixin(0x4e4e06c4, languageMessage.serializeBinary())

        // Title
        let titleMessage = new titleProto.TitleMixin()
        titleMessage.setTitle(this.title)
        content.addMixin(0x24da6114, titleMessage.serializeBinary())

        // Description
        let descriptionMessage = new descriptionProto.DescriptionMixin()
        descriptionMessage.setDescription(this.description)
        content.addMixin(0x5a474550, descriptionMessage.serializeBinary())
        console.log(content)
        // File
        let fileMessage = new fileProto.File()
        //console.log('decodedhash',Base58.decode(this.fileHash));
        fileMessage.setFilename(this.fileName);
        console.log(this.fileHash)
        fileMessage.setIpfsHash(Base58.decode(this.fileHash));
        fileMessage.setFilesize(this.fileSize);
        content.addMixin(0x0b62637e, fileMessage.serializeBinary())

        let ipfsHash = await content.save()

        if (this.feedId != '0') {
          await window.activeAccount.sendData(this.$itemDagFeedItems, 'addChild', [this.feedId, '0x1c12e8667bd48f87263e0745d7b28ea18f74ac0e', flagsNonce], 0, 'Attach feed item')
        }

        await window.activeAccount.sendData(this.$itemStoreIpfsSha256, 'create', [flagsNonce, ipfsHash], 0, 'Create image')
        this.$router.push({ name: 'item', params: { itemId: itemId }})
      }
    },
  }
</script>
