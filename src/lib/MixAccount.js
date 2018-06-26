const accountAbi = require('./Account.abi.json')

export default class MixAccount {

  constructor(vue, controllerAddress) {
    this.vue = vue
    this.controllerAddress = controllerAddress
  }

  init() {
    return this.vue.$db.get('/account/' + this.controllerAddress + '/contract')
    .then(contractAddress => {
      this.contractAddress = contractAddress
      this.contract = new this.vue.$web3.eth.Contract(accountAbi, contractAddress)
      return this
    })
  }

  deploy() {
    var fs = require('fs-extra')
    fs.readFile('./src/lib/Account.bin', 'ascii')
    .then(accountBytecode => {
      this.contract = new this.vue.$web3.eth.Contract(accountAbi)
      return this.contract.deploy({data: '0x' + accountBytecode}).send({
        from: this.controllerAddress,
        gas: 500000,
        gasPrice: 1
      })
      .on('error', error => {
        console.log(error)
      })
      .on('transactionHash', transactionHash => {
        console.log(transactionHash)
      })
      .on('receipt', receipt => {
        console.log(receipt)
        this.vue.$db.put('/account/' + this.controllerAddress + '/contract', receipt.contractAddress)
      })
      .then(newContractInstance => {
        console.log(newContractInstance)
      })
    })
  }

  unlock(password) {
    return this.vue.$web3.eth.personal.unlockAccount(this.controllerAddress, password, 0)
  }

  lock() {
    return this.vue.$web3.eth.personal.lockAccount(this.controllerAddress)
  }

  _call(transaction) {
    return transaction.call({
      from: this.controllerAddress,
    })
  }

  _send(transaction, value) {
    return transaction.estimateGas({
      from: this.controllerAddress,
      value: value,
    })
    .then (gas => {
      return transaction.send({
        from: this.controllerAddress,
        gasPrice: 1,
        gas: gas,
        value: value,
      })
    })
  }

  setController(newController) {
    return this._send(this.contract.methods.setControllerM(newController))
  }

  sendMix(to, value) {
    return this._send(this.contract.methods.sendMix(to))
  }

  consolidateMix() {
    return this._send(this.contract.methods.withdraw().send())
  }

  call(transaction, returnLength) {
    return this._call(this.contract.methods.callH(transaction._parent._address, transaction.encodeABI(), returnLength))
  }

  send(transaction, value, returnLength) {
    return this._send(this.contract.methods.callH(transaction._parent._address, transaction.encodeABI(), returnLength), value)
  }

}
