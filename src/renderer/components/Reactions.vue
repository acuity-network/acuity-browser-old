<template>

  <div>
    <span class="reactions" v-for="reaction in reactions" v-html="reaction.html + ' ' + reaction.count" v-on:mouseenter="setWho(reaction)" v-on:mouseleave="who = '&nbsp;'"  v-on:click="toggle(reaction)"></span>
    <span class="reactions" v-html="plus" v-on:click="react = !react"></span>
    <div v-html="who"></div>
    <div v-if="react" class="available">
      <span v-for="emoji in available" v-html="emoji.html" v-on:click="addReaction(emoji.binary)"></span>
    </div>
  </div>

</template>

<script>
  let twemoji = require('twemoji')
  import MixAccount from '../../lib/MixAccount.js'
  import MixItem from '../../lib/MixItem.js'

  export default {
    name: 'reactions',
    props: ['itemId'],
    components: {
    },
    data() {
      return {
        reactions: [],
        plus: '',
        who: '&nbsp;',
        available: [],
        react: false,
      }
    },
    created() {
      this.$reactions.events.allEvents({
        toBlock: 'pending',
        topics: [, this.itemId],
      })
      .on('data', log => {
        this.loadData()
      })
      .on('changed', log => {
        this.loadData()
      })

      this.loadData()

      this.plus = twemoji.parse(twemoji.convert.fromCodePoint('2795'), {folder: 'svg', ext: '.svg'})
    },
    methods: {
      async loadData() {
        let trustedReactions = await window.activeAccount.call(this.$reactions.methods.getTrustedReactions(this.itemId))
        let accountReactions = await window.activeAccount.call(this.$reactions.methods.getReactions(this.itemId))
        this.reactions = []

        let processedReactions = {}

        for (let i = 0; i < trustedReactions.itemReactions.length; i++) {
          let buf = Buffer.from(trustedReactions.itemReactions[i].substr(2), 'hex')

          for (let j = 0; j < 32; j += 4) {
            if (buf.readUInt32LE(j) == 0) {
              continue
            }
            let emoji = buf.toString('utf8', j, j + 4)

            if (emoji in processedReactions) {
              processedReactions[emoji].addresses.push(trustedReactions.itemReactionAccounts[i])
              processedReactions[emoji].count++
            }
            else {
              processedReactions[emoji] = {addresses: [trustedReactions.itemReactionAccounts[i]], count: 1, current: false}
            }
          }
        }

        let buf = Buffer.from(accountReactions.substr(2), 'hex')

        for (let i = 0; i < 32; i += 4) {
          if (buf.readUInt32LE(i) == 0) {
            continue
          }
          let emoji = buf.toString('utf8', i, i + 4)
          if (emoji in processedReactions) {
            processedReactions[emoji].addresses.push(window.activeAccount.contractAddress)
            processedReactions[emoji].count++
            processedReactions[emoji].current = true
          }
          else {
            processedReactions[emoji] = {addresses: [window.activeAccount.contractAddress], count: 1, current: true}
          }
        }

        let emojis = ['1f44d', '1f44e', '1f60d', '1f618', '1f61c', '1f911', '1f92b', '1f914', '1f910', '1f62c', '1f925', '1f915', '1f922', '1f603', '1f60e', '1f913', '1f9d0', '1f62d', '1f621', '1f4af', '1f4a4', '1f44c', '1f91e', '1f44f', '1f64f', '1f9d9']
        this.available = []
        for (let emoji of emojis) {
          let binary = twemoji.convert.fromCodePoint(emoji);
          if (!(binary in processedReactions && processedReactions[binary].current)) {
            let html = twemoji.parse(binary, {folder: 'svg', ext: '.svg'})
            this.available.push({html, binary})
          }
        }

        for (let emoji in processedReactions) {
          this.reactions.push({
            emoji: emoji,
            html: twemoji.parse(emoji, {folder: 'svg', ext: '.svg'}),
            count: processedReactions[emoji].count,
            current: processedReactions[emoji].current,
            addresses: processedReactions[emoji].addresses,
          })
        }
      },
      addReaction(emoji) {
        window.activeAccount.sendData(this.$reactions.methods.addReaction(this.itemId, Buffer.from(emoji, "utf8")), 0, 'Add reaction')
      },
      toggle(reaction) {
        if (reaction.current) {
          window.activeAccount.sendData(this.$reactions.methods.removeReaction(this.itemId, Buffer.from(reaction.emoji, "utf8")), 0, 'Remove reaction')
        }
        else {
          window.activeAccount.sendData(this.$reactions.methods.addReaction(this.itemId, Buffer.from(reaction.emoji, "utf8")), 0, 'Add reaction')
        }
      },
      async setWho(reaction) {
        let who = []

        for (let address of reaction.addresses) {
          let controller = await this.$db.get('/account/contract/' + address + '/controller')
          let account = await new MixAccount(this.$root, controller).init()
          let itemId = await account.call(this.$accountProfile.methods.getProfile())
          let profile = await new MixItem(this.$root, itemId).init()
          let revision = await profile.latestRevision().load()
          who.push(revision.getTitle())
        }

        this.who = who.join(', ')
      }
    },
  }

</script>

<style scoped>

  .reactions >>> img {
    cursor: pointer;
    height: 1.2em;
    width: 1.2em;
    vertical-align: -0.1em;
  }

  .reactions {
    margin-right: 0.5em;
  }

  .available >>> img {
    cursor: pointer;
    height: 2em;
    width: 2em;
    margin: 0 .05em 0 .1em;
    vertical-align: -0.1em;
  }

</style>
