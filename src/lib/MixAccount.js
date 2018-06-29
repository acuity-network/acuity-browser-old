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
    })
  }

  deploy() {
    var fs = require('fs-extra')
    return fs.readFile('./src/lib/Account.bin', 'ascii')
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

  call(transaction) {
    return transaction.call({
      from: this.contractAddress
    })
  }

  unlock(password) {
    return this.vue.$web3.eth.personal.unlockAccount(this.controllerAddress, password, 0)
  }

  lock() {
    return this.vue.$web3.eth.personal.lockAccount(this.controllerAddress)
  }

  _send(transaction, value) {
    return new Promise((resolve, reject) => {
      transaction.estimateGas({
        from: this.controllerAddress,
        value: value,
      })
      .then (gas => {
        transaction.send({
          from: this.controllerAddress,
          gasPrice: 1,
          gas: gas,
          value: value,
        })
        .on('transactionHash', transactionHash => {
          resolve(transactionHash)
        })
      })
    })
  }

  setController(newController) {
    return this._send(this.contract.methods.setController(newController))
  }

  consolidateMix() {
    return this._send(this.contract.methods.withdraw())
  }

  sendMix(to, value) {
    return this._send(this.contract.methods.sendMix(to), value)
  }

  sendData(transaction, value) {
    return this._send(this.contract.methods.sendData(transaction._parent._address, transaction.encodeABI()), value)
  }

}
