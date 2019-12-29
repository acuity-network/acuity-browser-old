import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    transcodings: [],
  },
  mutations: {
    transcodingsAdd(state, payload) {
      state.transcodings.push(payload)
    },
    transcodingsRemove(state, id) {
      let i = state.transcodings.map(item => item.id).indexOf(id)
      state.transcodings.splice(i, 1)
    },
  },
  actions: {
  },
  modules: {
  },
})
