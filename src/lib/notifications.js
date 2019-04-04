const path = require('path')

module.exports = {

    accountCreated: {
        title: "Account Created",
        body: "Mix Account Created!",
//        icon: path.join(__dirname, '../main/AcuityWebclip.png')
    },

    fundAccount: {
        title: "Insufficient Funds",
        body: "You must fund your Mix Account before doing this.",
//        icon: path.join(__dirname, '../main/AcuityWebclip.png')
    },

    mixReceived: (account, amount) => {
        return ({
            title: "Mix Received",
            body: "Account " + account + " received " + amount + " MIX.",
//            icon: path.join(__dirname, '../main/AcuityWebclip.png')
        })
    },

    itemIdCopied: (title) => {
      return ({
        title: "itemId copied",
        body: title,
//        icon: path.join(__dirname, '../main/AcuityWebclip.png')
      })
    },

}
