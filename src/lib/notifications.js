
export default {
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
  insufficientMix() {
    return {
      title: "Insufficient MIX",
      body: "Deposit more MIX into your account.",
      icon: 'static/icon.png',
    }
  },
  downloadComplete(fileName) {
    return {
      title: "Download Complete",
      body: fileName,
    }
  },
  downloadStarted(fileName) {
    return {
      title: "Download Started",
      body: fileName,
    }
  },
}
