<template>
  <div id="wrapper">
    <main>

      <section class="hero is-primary">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">{{ title }}</h1>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <ul>
            <li><router-link to="/profile/edit">Edit profile</router-link></li>
          </ul>
          <div v-html="image"></div>
          <div>Account type: <span v-html="type"></span></div>
          <div>Bio: <span v-html="bio"></span></div>
          <div>Location: <span v-html="location"></span></div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
  const Web3 = require('web3')
  var net = require('net')
  var web3 = new Web3(new Web3.providers.IpcProvider('/home/jbrown/mix-blockchain/mix.ipc', net))
  web3.eth.defaultAccount = '0xe58b128142a5e94b169396dd021f5f02fa38b3b0'
  web3.eth.defaultBlock = 'pending'
  const accountProfileAbi = require('./AccountProfile.abi.json')
  const accountProfile = new web3.eth.Contract(accountProfileAbi, '0x72f52ab6b1d15630ee9b2d8763b23478c0327df8')
  import MixItem from './mix_item.js'

  export default {
    name: 'profile',
    components: {},
    asyncComputed: {
      title() {
        return accountProfile.methods.getProfile().call()
        .then(itemId => {
          var item = new MixItem(itemId)
          return item.init()
        })
        .then(item => {
          return item.latestRevision().load()
        })
        .then(revision => {
          return revision.getTitle()
        })
      },
      bio() {
        return accountProfile.methods.getProfile().call()
        .then(itemId => {
          var item = new MixItem(itemId)
          return item.init()
        })
        .then(item => {
          return item.latestRevision().load()
        })
        .then(revision => {
          return revision.getBodyText()
        })
      },
      image() {
        return accountProfile.methods.getProfile().call()
        .then(itemId => {
          var item = new MixItem(itemId)
          return item.init()
        })
        .then(item => {
          return item.latestRevision().load()
        })
        .then(revision => {
          return revision.getImage()
        })
      },
      location() {
        return accountProfile.methods.getProfile().call()
        .then(itemId => {
          var item = new MixItem(itemId)
          return item.init()
        })
        .then(item => {
          return item.latestRevision().load()
        })
        .then(revision => {
          return revision.getProfile()
        })
        .then(result => {
          return result.location
        })
      },
      type() {
        return accountProfile.methods.getProfile().call()
        .then(itemId => {
          var item = new MixItem(itemId)
          return item.init()
        })
        .then(item => {
          return item.latestRevision().load()
        })
        .then(revision => {
          return revision.getProfile()
        })
        .then(result => {
          switch (result.type) {
            case 0: return 'Anon';
            case 1: return 'Person';
            case 2: return 'Project';
            case 3: return 'Organization';
            case 4: return 'Proxy';
            case 5: return 'Parody';
            case 6: return 'Bot';
          }
        })
      }
    }
  }
</script>
