import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    transcoding: false,
    transcodings: [],
  },
  mutations: {
    transcodingOn(state: any) {
      state.transcoding = true
    },
    transcodingOff(state: any) {
      state.transcoding = false
    },
    transcodingsAdd(state: any, payload: any) {
      payload.progress = ''
      state.transcodings.push(payload)
    },
    transcodingsSetPending(state: any, id: number) {
      let i = state.transcodings.map((item: any) => parseInt(item.id)).indexOf(id)
      state.transcodings[i].progress = ''
    },
    transcodingsSetProgress(state: any, payload: any) {
      let i = state.transcodings.map((item: any) => parseInt(item.id)).indexOf(parseInt(payload.id))
      let progress = Math.floor((payload.frame * 100) / state.transcodings[i].frames) + '%'
      if (payload.pass > 0) {
        progress += ' (pass ' + payload.pass + '/2)'
      }
      state.transcodings[i].progress = progress
    },
    transcodingsSetUnpublished(state: any, id: number) {
      let i = state.transcodings.map((item: any) => parseInt(item.id)).indexOf(id)
      state.transcodings[i].progress = 'unpublished'
    },
    transcodingsRemove(state: any, id: number) {
      let i = state.transcodings.map((item: any) => parseInt(item.id)).indexOf(id)
      state.transcodings.splice(i, 1)
    },
    transcodingsFail(state: any, id: number) {
      let i = state.transcodings.map((item: any) => parseInt(item.id)).indexOf(id)
      state.transcodings[i].progress = 'failed'
    },
  },
  actions: {
  },
})
