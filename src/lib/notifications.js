
export default {
  accountCreated() {
    return {
      title: "Account Created",
      body: "Mix Account Created!",
      icon: 'static/icon.png',
    }
  },
  fundAccount() {
    return {
      title: "Insufficient Funds",
      body: "You must fund your Mix Account before doing this.",
      icon: 'static/icon.png',
    }
  },
  mixReceived(account, amount) {
    return {
      title: "Mix Received",
      body: "Account " + account + " received " + amount + " MIX.",
      icon: 'static/icon.png',
    }
  },
  itemIdCopied(title) {
    return {
      title: "itemId copied",
      body: title,
      icon: 'static/icon.png',
    }
  },
  accountRecovered(address) {
    return {
      title: "Account Recovered",
      body: "Account " + address + " successfully recovered!",
      icon: 'static/icon.png',
    }
  },
}
