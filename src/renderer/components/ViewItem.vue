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
          <span v-html="body"></span>
          <div class="bodyText">{{ description }}</div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
  import languageProto from '../language_pb.js'
  import titleProto from '../title_pb.js'
  import bodyTextProto from '../body_pb.js'
  import descriptionProto from '../description_pb.js'
  import jpegImageProto from '../jpeg-image_pb.js'
  const Base58 = require("base-58")
  import router from '../router/index.js'
  import MixItem from './mix_item.js'

  export default {
    name: 'view-item',
    components: {},
    asyncComputed: {
      title() {

        var item = new MixItem(this.$route.params.itemId)

        return item.init()
        .then(item => {
          console.log(item)
          return item.revisions[0].load()
        })
        .then(revision => {
          return revision.getTitle()
        })
      },
      body() {

        var item = new MixItem(this.$route.params.itemId)

        return item.init()
        .then(item => {
          console.log(item)
          return item.revisions[0].load()
        })
        .then(revision => {
          return revision.getImage()
        })
      },
      description() {

        var item = new MixItem(this.$route.params.itemId)

        return item.init()
        .then(item => {
          console.log(item)
          return item.revisions[0].load()
        })
        .then(revision => {
          return revision.getDescription()
        })
      }
    }
  }
</script>

<style>

  body {
    font-family: 'OpenSans', 'sans-serif';
  }

</style>
