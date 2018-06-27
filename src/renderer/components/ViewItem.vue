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
  import MixItem from './mix_item.js'

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
    beforeRouteEnter (to, from, next) {
      next(vm => {
        var item = new MixItem(vm, vm.$route.params.itemId)

        return item.init()
        .then(item => {
          console.log(item)
          return item.revisions[0].load()
        })
        .then(revision => {
          vm.title = revision.getTitle()
          vm.body = revision.getImage()
          vm.description = revision.getDescription()
        })
      })
    }
  }
</script>

<style>

  body {
    font-family: 'OpenSans', 'sans-serif';
  }

</style>
