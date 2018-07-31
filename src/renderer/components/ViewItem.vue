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
  import MixItem from '../../lib/MixItem.js'

  export default {
    name: 'view-item',
    components: {},
    data() {
      return {
        title: '',
        body: '',
        description: '',
      }
    },
    created () {
      var item = new MixItem(this.$root, this.$route.params.itemId)

      return item.init()
      .then(item => {
        return item.latestRevision().load()
      })
      .then(revision => {
        this.title = revision.getTitle()
        this.body = revision.getImage()
        this.description = revision.getDescription()
      })
    }
  }
</script>

<style>

  body {
    font-family: 'OpenSans', 'sans-serif';
  }

</style>
