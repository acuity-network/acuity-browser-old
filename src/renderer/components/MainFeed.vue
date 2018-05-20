<template>
  <div id="wrapper">
    <main>
      Hi!
      {{ electron }}
    </main>
  </div>
</template>

<script>
  export default {
    name: 'main-feed',
    components: {},
    methods: {
      open (link) {
        this.$electron.shell.openExternal(link)
      }
    },
    data () {
      return {
        electron: this.$web3.version
      }
    }
  }
</script>
