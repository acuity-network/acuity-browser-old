<template>

  <div>
    <span class="reactions" v-for="reaction in reactions" v-html="reaction.html + ' ' + reaction.count" @mouseenter="setWho(reaction)" @click="toggle(reaction)"></span>
    <span class="reactions" v-html="plus" @click="react = !react"></span>
    <div class="who">
      <profile-link v-for="address in addresses" :address="address" :key="address"></profile-link>
      &nbsp;
    </div>
    <div v-if="react" class="available">
      <span v-for="emoji in available" v-html="emoji.html" @click="addReaction(emoji.binary)"></span>
    </div>
  </div>

</template>

<script>
  import twemoji from 'twemoji'
  import MixAccount from '../../lib/MixAccount.js'
  import MixItem from '../../lib/MixItem.js'
  import ProfileLink from './ProfileLink.vue'

  export default {
    name: 'reactions',
    props: ['itemId'],
    components: {
      ProfileLink,
    },
    data() {
      return {
        reactions: [],
        plus: '',
        addresses: [],
        available: [],
        react: false,
      }
    },
    created() {
      this.reactionsEmitter = this.$mixClient.reactions.events.allEvents({
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
    destroyed() {
      this.reactionsEmitter.unsubscribe()
    },
    methods: {
      async loadData() {
        let trustedReactions = await this.$activeAccount.get().call(this.$mixClient.reactions, 'getTrustedReactions', [this.itemId])
        let accountReactions = await this.$activeAccount.get().call(this.$mixClient.reactions, 'getReactions', [this.itemId])
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
            processedReactions[emoji].addresses.push(this.$activeAccount.get().contractAddress)
            processedReactions[emoji].count++
            processedReactions[emoji].current = true
          }
          else {
            processedReactions[emoji] = {addresses: [this.$activeAccount.get().contractAddress], count: 1, current: true}
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
      async addReaction(emoji) {
        await this.$activeAccount.get().sendData(this.$mixClient.reactions, 'addReaction', [this.itemId, Buffer.from(emoji, "utf8")], 0, 'Add reaction')
        this.loadData()
      },
      async toggle(reaction) {
        if (reaction.current) {
          await this.$activeAccount.get().sendData(this.$mixClient.reactions, 'removeReaction', [this.itemId, Buffer.from(reaction.emoji, "utf8")], 0, 'Remove reaction')
          this.loadData()
        }
        else {
          await this.$activeAccount.get().sendData(this.$mixClient.reactions, 'addReaction', [this.itemId, Buffer.from(reaction.emoji, "utf8")], 0, 'Add reaction')
          this.loadData()
        }
      },
      async setWho(reaction) {
        this.addresses = reaction.addresses
      },
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

  .who >>> a::after {
    content: ", ";
  }

  .who >>> a:last-child::after {
    content: "";
  }

</style>
