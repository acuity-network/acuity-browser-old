<template>
  <page>
    <template slot="title">
      {{ $t('downloads') }}
    </template>

    <template slot="body">
       <b-table ref="dlTable" :key="refreshKey" :data="data">
        <template slot-scope="props">
          <b-table-column field="name" label="Name">
            {{props.row.name}}
          </b-table-column>

          <b-table-column field="size" label="Size">
            {{props.row.size}}
          </b-table-column>

          <b-table-column field="status" label="Status">
            {{props.row.status}}
          </b-table-column>

          <b-table-column field="progress" label="Progress">
            {{props.row.progress}}%
          </b-table-column>

          <b-table-column>
            <span v-if="props.row.status == 'Complete'" class="clickable" @click="openFile" :data-index="props.row.index">Open</span> &nbsp;
            <span v-if="props.row.status != 'Deleted'" class="clickable" @click="deleteFile" :data-index="props.row.index">Delete</span>
          </b-table-column>

        </template>
      </b-table>
    </template>
  </page>
</template>

<script>
  import Page from './Page.vue'
  import setTitle from '../../lib/setTitle.js'

  export default {
    name: 'downloads',
    components: {
      Page,
    },
    data() {
      return {
        refreshKey:0,
        data: new Array(window.downloads.length),
      }
    },
    methods: {
      loadDownloads() {
        for (let i = 0; i < window.downloads.length; i++) {
          this.data[i] = ({
            index:i,
            name: window.downloads[i].getName(),
            size: window.downloads[i].sizeFormatted(),
            status: window.downloads[i].getStatus(),
            progress: window.downloads[i].getProgress(),
          })
          window.downloads[i].on('progress', (progress) =>{
            if(progress > this.data[i].progress + 1) {
              this.data[i].progress = window.downloads[i].getProgress()
              this.data[i].status = window.downloads[i].getStatus()
              this.refreshKey++
            }
          })
          window.downloads[i].on('done', ()=>{
            this.data[i].status = window.downloads[i].getStatus()
            this.data[i].progress = 100
            window.downloads[i].removeAllListeners();
            this.refreshKey++
          })
        }
      },
      async deleteFile(event) {
        let i = event.target.dataset.index;
        await window.downloads[i].stopdeleteFile()
        this.data[i].status = window.downloads[i].getStatus()
        window.downloads[i].removeAllListeners();
        this.refreshKey++
      },
      openFile(event) {
        window.downloads[event.target.dataset.index].openFile()
      }
    },
    created() {
      setTitle(this.$t('downloads'))
      this.loadDownloads()
    },
    destroyed() {
        for (let download of window.downloads) {
            try{
                download.removeAllListeners()
            } catch (e) {
                console.log(e)
            }
        }
    }
  }
</script>

<style scoped>
  .clickable {
    cursor: pointer;
    user-select: none;
    color: #3273dc;
  }

  .footer-link {
    padding-right: 20px;
  }
</style>
