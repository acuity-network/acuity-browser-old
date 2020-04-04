<template>
  <div>
    <b-field class="file">
      <b-upload v-model="file">
        <a class="button is-primary">
          <b-icon icon="upload"></b-icon>
          <span>{{ $t('ImageEdit.ChooseImage') }}</span>
        </a>
      </b-upload>
      <span class="file-name" v-if="file">
        {{ file.name }}
      </span>
    </b-field>
    <div></div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import Image from '../../../lib/Image'

  export default Vue.extend({
    name: 'image-edit',
    props: ['value'],
    data() {
      return {
        file: null,
      }
    },
    methods: {
      async save() {
        let image = new Image(this.$root, this.file)
        return image.createMixin()
      },
    }
  })

</script>
