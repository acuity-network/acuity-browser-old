const state = {
  controllerAddress: ''
}

const mutations = {
  setActiveAccount (state, controllerAddress) {
    state.controllerAddress = controllerAddress
  },
}

const actions = {
  setActiveAccount ({ commit }, controllerAddress) {
    commit('setActiveAccount', controllerAddress)
  },
}

export default {
  state,
  mutations,
  actions,
}
