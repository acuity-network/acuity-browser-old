<template>
  <page>
    <template slot="title">
      {{ $t('settings') }}
    </template>

    <template slot="body">
      <b-field :label="$t('language')">
        <b-select v-model="locale">
          <option value="en-US">English</option>
          <option value="ru">русский</option>
        </b-select>
      </b-field>
      <b-field label="Advanced">
        <b-checkbox v-model="development">
          Development mode
        </b-checkbox>
      </b-field>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'settings',
    components: {
      Page,
    },
    data() {
      return {
        locale: this.$settings.get('locale'),
        development: this.$settings.get('development'),
      }
    },
    watch: {
      locale() {
        this.$root.$i18n.locale = this.locale;
        this.$settings.set('locale', this.locale);
      },
      development() {
        this.$settings.set('development', this.development);
        this.$root.$emit('development', this.development)
      },
    },
    created() {
      setTitle(this.$t('settings'))
    },
  }
</script>
