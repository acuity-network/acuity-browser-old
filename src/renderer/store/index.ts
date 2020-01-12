import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    transcodings: [],
  },
  mutations: {
    transcodingsAdd(state, payload) {
      payload.progress = ''
      state.transcodings.push(payload)
    },
    transcodingsSetProgress(state, payload) {
      let i = state.transcodings.map(item => parseInt(item.id)).indexOf(parseInt(payload.id))
      let progress = Math.floor((payload.frame * 100) / state.transcodings[i].frames) + '%'
      if (payload.pass > 0) {
        progress += ' (pass ' + payload.pass + ')'
      }
      state.transcodings[i].progress = progress
    },
    transcodingsRemove(state, id) {
      let i = state.transcodings.map(item => parseInt(item.id)).indexOf(parseInt(id))
      state.transcodings.splice(i, 1)
    },
  },
  actions: {
  },
  modules: {
  },
})
