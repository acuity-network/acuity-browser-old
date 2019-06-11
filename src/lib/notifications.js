
export default {
  mixReceived(account, amount) {
    return {
      title: "Mix Received",
      body: "Account " + account + " received " + amount + " MIX.",
    }
  },
  itemIdCopied(title) {
    return {
      title: "itemId copied",
      body: title,
    }
  },
  accountRecovered(address) {
    return {
      title: "Account Recovered",
      body: "Account " + address + " successfully recovered!",
    }
  },
  insufficientMix() {
    return {
      title: "Insufficient MIX",
      body: "Deposit more MIX into your account.",
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
