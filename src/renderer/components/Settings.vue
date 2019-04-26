<template>
  <page>
    <template slot="title">
      Settings
    </template>

    <template slot="body">

      <b-field label="Language">
        <b-select v-model="locale">
          <option value="en">English - en</option>
          <option value="ru">Russian - ru</option>
        </b-select>
      </b-field>

    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import i18n from '../plugins/i18n'

  export default {
    name: 'settings',
    components: {
      Page,
    },
    data() {
      return {
        locale:i18n.locale
      }
    },
    methods: {

    },
    watch: {
      locale() {
        i18n.locale = this.locale;
        this.$db.put('/locale', this.locale);
      }
    },
    async created() {

    }
  }
</script>
