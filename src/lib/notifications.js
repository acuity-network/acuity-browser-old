
export default {
  mixReceived(account, amount) {
    return {
      title: "Mix Received",
      body: "Account " + account + " received " + amount + " MIX.",
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
