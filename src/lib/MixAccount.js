let accountAbi = require('./contracts/Account.abi.json')
import ethTx from 'ethereumjs-tx'
import { remote } from 'electron'
import path from 'path'
import fs from 'fs'

export default class MixAccount {

  constructor(vue, address, isContract = false) {
    this.vue = vue
    if (isContract) {
      this.contractAddress = address
    }
    else {
      this.controllerAddress = address
    }
  }

  async init() {
    if (this.contractAddress) {
      try {
        this.controllerAddress = await this.vue.$db.get('/account/contract/' + this.contractAddress + '/controller')
      } catch (e) {}
    }
    else {
      try {
        this.contractAddress = await this.vue.$db.get('/account/controller/' + this.controllerAddress + '/contract')
      } catch (e) {}
    }
    if (this.contractAddress) {
      this.contract = new this.vue.$mixClient.web3.eth.Contract(accountAbi, this.contractAddress)
    }
    return this
  }

  _logTransaction(transaction, to, description) {
    let info = {
      hash: transaction.hash,
      to: to,
      description: description,
    }
    return this.vue.$db.put('/account/controller/' + this.controllerAddress + '/transaction/' + transaction.nonce, JSON.stringify(info))
  }

  async deploy() {
    return new Promise(async (resolve, reject) => {
      let byteCodePath
      if (process.env.NODE_ENV !== 'development') {
        byteCodePath = path.join(remote.app.getAppPath(), '..', 'extraResources', 'Account.bin')
      }
      else {
        byteCodePath = path.join(remote.app.getAppPath(), '..', '..', '..', '..', '..', 'src', 'extraResources', 'Account.bin')
      }

      let accountBytecode = fs.readFileSync(byteCodePath, 'ascii')
      let nonce = await this.vue.$mixClient.web3.eth.getTransactionCount(this.controllerAddress)
      let rawTx = {
        nonce: this.vue.$mixClient.web3.utils.toHex(nonce),
        from: this.controllerAddress,
        gasPrice: '0x3b9aca00',
        data: '0x' + accountBytecode,
      }
      rawTx.gas = this.vue.$mixClient.web3.utils.toHex(await this.vue.$mixClient.web3.eth.estimateGas(rawTx))
      let tx = new ethTx(rawTx)
      let privateKey = await this.vue.$db.get('/account/controller/' + this.controllerAddress + '/privateKey')
      tx.sign(Buffer.from(privateKey.substr(2), 'hex'))
      let serializedTx = tx.serialize()
      this.vue.$mixClient.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
      .on('error', reject)
      .on('receipt', async receipt => {
        this.contractAddress = receipt.contractAddress
        await this.vue.$db.batch()
        .put('/account/controller/' + this.controllerAddress + '/contract', this.contractAddress)
        .put('/account/contract/' + this.contractAddress + '/controller', this.controllerAddress)
        .write()
        this.contract = new this.vue.$mixClient.web3.eth.Contract(accountAbi, this.contractAddress)
        resolve()
      })
    })
  }

  select() {
    window.activeAccount = this
    this.vue.$db.put('/active-account', this.controllerAddress)
    this.vue.$root.$emit('change-active-account', this)
  }

  call(contract, method, params = []) {
    return contract.methods[method].apply(this, params).call({
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

  _send(transaction, value = 0, checkBalance = true) {
    return new Promise(async (resolve, reject) => {
      let nonce = await this.vue.$mixClient.web3.eth.getTransactionCount(this.controllerAddress)
      let data = await transaction.encodeABI()
      let gas = 200000 //await this.vue.$mixClient.web3.eth.estimateGas(rawTx)
      // Check if there is sufficient balance.
      let toBN = this.vue.$mixClient.web3.utils.toBN
      let controllerBalance = toBN(await this.getUnconfirmedControllerBalance())
      let requiredBalance = toBN(gas * 2).mul(toBN('1000000000'))
      if (checkBalance && controllerBalance.lt(requiredBalance)) {
        let notification = this.vue.$notifications.insufficientMix(this.title)
        new Notification(notification.title, notification)
        reject()
      }
      let rawTx = {
        nonce: nonce,
        from: this.controllerAddress,
        to: this.contractAddress,
        gas: this.vue.$mixClient.web3.utils.toHex(gas),
        gasPrice: '0x3b9aca00',
        data: data,
        value: this.vue.$mixClient.web3.utils.toHex(value),
      }
      let tx = new ethTx(rawTx)
      let privateKey = await this.vue.$db.get('/account/controller/' + this.controllerAddress + '/privateKey')
      tx.sign(Buffer.from(privateKey.substr(2), 'hex'))
      let serializedTx = tx.serialize()
      this.vue.$mixClient.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
      .on('error', reject)
      .on('transactionHash', transactionHash => {
        this.vue.$mixClient.web3.eth.getTransaction(transactionHash)
        .then(resolve)
      })
    })
  }

  setController(newController) {
    return this._send(this.contract.methods.setController(newController))
  }

  consolidateMix() {
    return new Promise((resolve, reject) => {
      this.vue.$mixClient.web3.eth.getBalance(this.contractAddress, 'pending')
      .then(balance => {
        if (balance > 0) {
          this._send(this.contract.methods.withdraw(), 0, false)
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
    let data = await this.vue.$mixClient.web3.eth.getCode(to)
    if (data == '0x') {
      // Send to a non-contract address.
      return new Promise(async (resolve, reject) => {
        let nonce = await this.vue.$mixClient.web3.eth.getTransactionCount(this.controllerAddress)
        let rawTx = {
          nonce: nonce,
          from: this.controllerAddress,
          to: to,
          gas: 21000,
          gasPrice: '0x3b9aca00',
          value: this.vue.$mixClient.web3.utils.toHex(value),
        }
        let tx = new ethTx(rawTx)
        let privateKey = await this.vue.$db.get('/account/controller/' + this.controllerAddress + '/privateKey')
        tx.sign(Buffer.from(privateKey.substr(2), 'hex'))
        let serializedTx = tx.serialize()
        this.vue.$mixClient.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
        .on('transactionHash', transactionHash => {
          this.vue.$mixClient.web3.eth.getTransaction(transactionHash)
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

  sendData(contract, method, params, value, description) {
    let to = contract.options.address
    let data = contract.methods[method].apply(this, params).encodeABI()
    return this._send(this.contract.methods.sendData(to, data), value)
    .then(transaction => {
      return this._logTransaction(transaction, to, description)
      .then(() => {
        return transaction
      })
    })
  }

  getControllerBalance() {
    return this.vue.$mixClient.web3.eth.getBalance(this.controllerAddress, 'latest')
  }

  getUnconfirmedControllerBalance() {
    return this.vue.$mixClient.web3.eth.getBalance(this.controllerAddress, 'pending')
  }

  getBalance() {
    let toBN = this.vue.$mixClient.web3.utils.toBN
    return Promise.all([
      this.vue.$mixClient.web3.eth.getBalance(this.controllerAddress, 'latest'),
      this.vue.$mixClient.web3.eth.getBalance(this.contractAddress, 'latest'),
    ])
    .then(balances => {
      return toBN(balances[0]).add(toBN(balances[1]))
    })
  }

  getUnconfirmedBalance() {
    let toBN = this.vue.$mixClient.web3.utils.toBN
    return Promise.all([
      this.vue.$mixClient.web3.eth.getBalance(this.controllerAddress, 'pending'),
      this.vue.$mixClient.web3.eth.getBalance(this.contractAddress, 'pending'),
    ])
    .then(balances => {
      return toBN(balances[0]).add(toBN(balances[1]))
    })
  }

  async getTransactionInfo(nonce) {
    let infoJson = await this.vue.$db.get('/account/controller/' + this.controllerAddress + '/transaction/' + nonce)
    let info = JSON.parse(infoJson)

    let receipt = this.vue.$mixClient.web3.eth.getTransactionReceipt(info.hash)
    let transaction = this.vue.$mixClient.web3.eth.getTransaction(info.hash)
    info.receipt = await receipt

    if (info.receipt)  {
      info.block = await this.vue.$mixClient.web3.eth.getBlock(info.receipt.blockNumber)
    }

    info.transaction = await transaction
    return info
  }

  getTrustedThatTrust(address) {
    return this.call(this.vue.$mixClient.trustedAccounts, 'getTrustedThatTrustAccount', [address])
  }

  getProfile() {
    return this.call(this.vue.$mixClient.accountProfile, 'getProfile')
  }

}
