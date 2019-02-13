const accountAbi = require('./Account.abi.json')

export default class MixAccount {

  constructor(vue, controllerAddress) {
    this.vue = vue
    this.controllerAddress = controllerAddress
  }

  async init() {
    try {
      let contractAddress = await this.vue.$db.get('/account/controller/' + this.controllerAddress + '/contract')
      this.contractAddress = contractAddress
      this.contract = new this.vue.$web3.eth.Contract(accountAbi, contractAddress)
    }
    catch (e) {}
    return this
  }

  _logTransaction(transaction, to, description) {
    var info = {
      hash: transaction.hash,
      to: to,
      description: description,
    }
    return this.vue.$db.put('/account/controller/' + this.controllerAddress + '/transaction/' + transaction.nonce, JSON.stringify(info))
  }

  async deploy() {
    let fs = require('fs-extra')
    let ethTx = require('ethereumjs-tx')
    let accountBytecode = await fs.readFile('./src/lib/Account.bin', 'ascii')
    let nonce = await this.vue.$web3.eth.getTransactionCount(this.controllerAddress)
    let rawTx = {
      nonce: this.vue.$web3.utils.toHex(nonce),
      from: this.controllerAddress,
      gas: this.vue.$web3.utils.toHex(1000000),
      gasPrice: '0x01',
      data: '0x' + accountBytecode,
    }

    let tx = new ethTx(rawTx)
    let privateKey = await this.vue.$db.get('/account/controller/' + this.controllerAddress + '/privateKey')
    tx.sign(Buffer.from(privateKey.substr(2), 'hex'))
    let serializedTx = tx.serialize()

    this.vue.$web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
    .on('error', console.log)
    .on('transactionHash', console.log)
    .on('receipt', receipt => {
      console.log(receipt)
      this.contractAddress = receipt.contractAddress
      this.vue.$db.batch()
      .put('/account/controller/' + this.controllerAddress + '/contract', this.contractAddress)
      .put('/account/contract/' + this.contractAddress + '/controller', this.controllerAddress)
      .write()
    })
  }

  call(transaction) {
    return transaction.call({
      from: this.contractAddress
    })
  }

  unlock(password) {
  }

  lock() {
  }

  async isUnlocked() {
    return true
  }

  _send(transaction, value) {
    return new Promise(async (resolve, reject) => {
      let nonce = await this.vue.$web3.eth.getTransactionCount(this.controllerAddress)
/*      let gas = await transaction.estimateGas({
        from: this.controllerAddress,
        value: value,
      })
*/    let gas = 500000
      let data = await transaction.encodeABI()
      let rawTx = {
        nonce: nonce,
        from: this.controllerAddress,
        to: transaction._parent._address,
        gas: this.vue.$web3.utils.toHex(gas),
        gasPrice: '0x01',
        data: data,
        value: this.vue.$web3.utils.toHex(value),
      }

      let ethTx = require('ethereumjs-tx')
      let tx = new ethTx(rawTx)
      let privateKey = await this.vue.$db.get('/account/controller/' + this.controllerAddress + '/privateKey')
      tx.sign(Buffer.from(privateKey.substr(2), 'hex'))
      let serializedTx = tx.serialize()
      this.vue.$web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
      .on('transactionHash', transactionHash => {
        this.vue.$web3.eth.getTransaction(transactionHash)
        .then(resolve)
      })
    })
  }

  setController(newController) {
    return this._send(this.contract.methods.setController(newController))
  }

  consolidateMix() {
    return new Promise((resolve, reject) => {
      this.vue.$web3.eth.getBalance(this.contractAddress, 'pending')
      .then(balance => {
        if (balance > 0) {
          this._send(this.contract.methods.withdraw())
          .then(tx => {
            resolve()
          })
        }
        else {
          resolve()
        }
      })
    })
  }

  async sendMix(to, value) {
    // Check if the destination is a contract.
    let data = await this.vue.$web3.eth.getCode(to)
    if (data == '0x') {
      // Send to a non-contract address.
      return new Promise(async (resolve, reject) => {
        let nonce = await this.vue.$web3.eth.getTransactionCount(this.controllerAddress)
        let rawTx = {
          nonce: nonce,
          from: this.controllerAddress,
          to: to,
          gas: 21000,
          gasPrice: 1,
          value: this.vue.$web3.utils.toHex(value),
        }
        let ethTx = require('ethereumjs-tx')
        let tx = new ethTx(rawTx)
        let privateKey = await this.vue.$db.get('/account/controller/' + this.controllerAddress + '/privateKey')
        tx.sign(Buffer.from(privateKey.substr(2), 'hex'))
        let serializedTx = tx.serialize()
        this.vue.$web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
        .on('transactionHash', transactionHash => {
          this.vue.$web3.eth.getTransaction(transactionHash)
          .then(transaction => {
            this._logTransaction(transaction, to, 'Send MIX')
            .then(() => {
              resolve(transaction)
            })
          })
        })
      })
    }
    else {
      // Send to a contract address.
      return this._send(this.contract.methods.sendMix(to), value)
      .then(transaction => {
        return this._logTransaction(transaction, to, 'Send MIX')
        .then(() => {
          return transaction
        })
      })
    }
  }

  sendData(transaction, value, description) {
    var to = transaction._parent._address
    return this._send(this.contract.methods.sendData(to, transaction.encodeABI()), value)
    .then(transaction => {
      return this._logTransaction(transaction, to, description)
      .then(() => {
        return transaction
      })
    })
  }

  getBalance() {
    var BN = this.vue.$web3.utils.BN
    return Promise.all([
      this.vue.$web3.eth.getBalance(this.controllerAddress, 'latest'),
      this.vue.$web3.eth.getBalance(this.contractAddress, 'latest'),
    ])
    .then(balances => {
      return new BN(balances[0]).add(new BN(balances[1]))
    })
  }

  getUnconfirmedBalance() {
    var BN = this.vue.$web3.utils.BN
    return Promise.all([
      this.vue.$web3.eth.getBalance(this.controllerAddress, 'pending'),
      this.vue.$web3.eth.getBalance(this.contractAddress, 'pending'),
    ])
    .then(balances => {
      return new BN(balances[0]).add(new BN(balances[1]))
    })
  }

  async getTransactionInfo(nonce) {
    let infoJson = await this.vue.$db.get('/account/controller/' + this.controllerAddress + '/transaction/' + nonce)
    let info = JSON.parse(infoJson)

    let receipt = this.vue.$web3.eth.getTransactionReceipt(info.hash)
    let transaction = this.vue.$web3.eth.getTransaction(info.hash)
    info.receipt = await receipt

    if (info.receipt)  {
      info.block = await this.vue.$web3.eth.getBlock(info.receipt.blockNumber)
    }

    info.transaction = await transaction
    return info
  }

  getTrustedThatTrust(address) {
    return this.call(this.vue.$trustedAccounts.methods.getTrustedThatTrustAccount(address))
  }

  getProfile() {
    return this.call(this.vue.$accountProfile.methods.getProfile())
  }

}
