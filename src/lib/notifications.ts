
export default {
  mixReceived(account: string, amount: string) {
    return {
      title: "Mix Received",
      body: "Account " + account + " received " + amount + " MIX.",
    }
  },
  downloadComplete(fileName: string) {
    return {
      title: "Download Complete",
      body: fileName,
    }
  },
  downloadStarted(fileName: string) {
    return {
      title: "Download Started",
      body: fileName,
    }
  },
}
