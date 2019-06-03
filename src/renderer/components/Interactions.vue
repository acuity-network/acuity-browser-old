<template>
  <page>
    <template slot="title">
      {{ $t('interactions') }}
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'interactions',
    components: {
      Page,
    },
    created() {
      setTitle(this.$t('interactions'))
    }
  }
</script>
