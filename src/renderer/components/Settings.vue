<template>
  <page>
    <template slot="title">
      {{ $t('settings') }}
    </template>

    <template slot="body">
      <b-field :label="$t('language')">
        <b-select v-model="locale">
          <option value="en">English - en</option>
          <option value="ru">Russian - ru</option>
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
  import i18n from '../plugins/i18n'
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
        i18n.locale = this.locale;
        this.$settings.set('locale', this.locale);
      },
      development() {
        this.$settings.set('development', this.development);
      },
    },
    created() {
      setTitle(this.$t('settings'))
    },
  }
</script>
