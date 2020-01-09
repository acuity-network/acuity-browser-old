<template>
  <page>
    <template slot="title">
      {{ $t('Transcoding.Transcoding') }}
    </template>

    <template slot="body">
      <b-table :data="transcodings">
        <template slot-scope="props">
          <b-table-column :label="$t('Transcoding.Item')">
            <item-link :itemId="props.row.itemId"></item-link>
          </b-table-column>
          <b-table-column :label="$t('Transcoding.Width')">
            {{ props.row.width }}
          </b-table-column>
          <b-table-column :label="$t('Transcoding.Height')">
            {{ props.row.height }}
          </b-table-column>
          <b-table-column>
            <a @click="deleteJob" :data-id="props.row.id">delete</a>
          </b-table-column>
        </template>
      </b-table>
      <b-field label="H.264 CRF" message="18 to 28. Lower value increases quality and bitrate.">
        <b-input v-model="crf" type="number" min="18" max="28">
        </b-input>
      </b-field>
      <b-field label="H.264 Encoding Speed" message="Affects bitrate, not quality.">
        <b-select v-model="preset">
          <option value="veryslow">Very slow</option>
          <option value="slower">Slower</option>
          <option value="slow">Slow</option>
          <option value="medium">Medium</option>
          <option value="fast">Fast</option>
          <option value="faster">Faster</option>
          <option value="veryfast">Very fast</option>
        </b-select>
      </b-field>
    </template>
  </page>
</template>

<script lang="ts">
  import Page from '../Page.vue'
  import ItemLink from '../ItemLink.vue'
  import setTitle from '../../../lib/setTitle'

  export default {
    name: 'transcoding',
    components: {
      Page,
      ItemLink,
    },
    data() {
      return {
        crf: this.$settings.get('h264.crf'),
        preset: this.$settings.get('h264.preset'),
      }
    },
    async created() {
      setTitle(this.$t('Transcoding.Transcoding'))
    },
    computed: {
      transcodings() {
        return this.$store.state.transcodings
      }
    },
    methods: {
      async deleteJob(event) {
        await this.$db.del('/transcode/' + event.target.dataset.id)
        this.$store.commit('transcodingsRemove', event.target.dataset.id)
      }
    },
    watch: {
      crf() {
        this.$settings.set('h264.crf', this.crf)
      },
      preset() {
        this.$settings.set('h264.preset', this.preset)
      },
    },
  }
</script>
