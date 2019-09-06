let accountAbi = require('./contracts/MixAccount.abi.json')
import ethTx from 'ethereumjs-tx'
import { remote } from 'electron'
import path from 'path'
import fs from 'fs'
import keythereum from 'keythereum'

let privateKeys = {}

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

  async storeMapping() {
    let nonce = await this.vue.$mixClient.web3.eth.getTransactionCount(this.controllerAddress)
    let to = this.vue.$mixClient.accountRegistry.options.address
    let data = this.vue.$mixClient.accountRegistry.methods.set(this.contractAddress).encodeABI()
    let rawTx = {
      nonce: nonce,
      from: this.controllerAddress,
      to: to,
      gasPrice: '0x3b9aca00',
      data: data,
    }
    rawTx.gas = 50000//await this.vue.$mixClient.web3.eth.estimateGas(rawTx)
    let tx = new ethTx(rawTx)
    let privateKey = privateKeys[this.controllerAddress]
    tx.sign(Buffer.from(privateKey.substr(2), 'hex'))
    let serializedTx = tx.serialize()
    this.vue.$mixClient.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
    .on('error', console.error)
  }

  async deploy() {
    return new Promise(async (resolve, reject) => {
      if (!this.isUnlocked()) {
        this.vue.$buefy.toast.open({message: 'Account is locked', type: 'is-danger'})
        reject()
        return
      }
      let byteCodePath = path.join(__static, 'MixAccount.bin')
      let accountBytecode = fs.readFileSync(byteCodePath, 'ascii').trim()
      let nonce = await this.vue.$mixClient.web3.eth.getTransactionCount(this.controllerAddress)
      let rawTx = {
        nonce: this.vue.$mixClient.web3.utils.toHex(nonce),
        from: this.controllerAddress,
        gasPrice: '0x3b9aca00',
        data: '0x' + accountBytecode,
      }
      rawTx.gas = this.vue.$mixClient.web3.utils.toHex(await this.vue.$mixClient.web3.eth.estimateGas(rawTx))
      let tx = new ethTx(rawTx)
      let privateKey = privateKeys[this.controllerAddress]
      tx.sign(Buffer.from(privateKey.substr(2), 'hex'))
      let serializedTx = tx.serialize()
      this.vue.$mixClient.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
      .on('error', reject)
      .on('receipt', async receipt => {
        this.contractAddress = receipt.contractAddress
        this.storeMapping()
        await this.vue.$db.batch()
        .put('/account/controller/' + this.controllerAddress + '/contract', this.contractAddress)
        .put('/account/contract/' + this.contractAddress + '/controller', this.controllerAddress)
        .write()
        this.contract = new this.vue.$mixClient.web3.eth.Contract(accountAbi, this.contractAddress)
        resolve()
      })
    })
  }

  deployToken(symbol, name, itemId, initialBalance, dailyPayout) {
    return new Promise(async (resolve, reject) => {
      if (!this.isUnlocked()) {
        this.vue.$buefy.toast.open({message: 'Account is locked', type: 'is-danger'})
        reject()
        return
      }
      let byteCodePath = path.join(__static, 'CreatorToken.bin')
      let tokenBytecode = fs.readFileSync(byteCodePath, 'ascii').trim()
      let types = ['string', 'string', 'address', 'bytes32', 'address', 'uint', 'uint']
      let params = [symbol, name, this.vue.$mixClient.tokenRegistryAddress, itemId, this.contractAddress, initialBalance, dailyPayout]
      let paramsBytecode = this.vue.$mixClient.web3.eth.abi.encodeParameters(types, params).slice(2)
      let nonce = await this.vue.$mixClient.web3.eth.getTransactionCount(window.activeAccount.controllerAddress)
      let rawTx = {
        nonce: this.vue.$mixClient.web3.utils.toHex(nonce),
        from: window.activeAccount.controllerAddress,
        gas: this.vue.$mixClient.web3.utils.toHex(2000000),
        gasPrice: '0x3b9aca00',
        data: '0x' + tokenBytecode + paramsBytecode,
      }

      let tx = new ethTx(rawTx)
      let privateKey = privateKeys[window.activeAccount.controllerAddress]
      tx.sign(Buffer.from(privateKey.substr(2), 'hex'))
      let serializedTx = tx.serialize()

      this.vue.$mixClient.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
      .on('error', reject)
      .on('receipt', async receipt => {
        let transaction = await this.vue.$mixClient.web3.eth.getTransaction(receipt.transactionHash)
        this._logTransaction(transaction, '', 'Deploy token')
        resolve(receipt.contractAddress)
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

  async unlock(password) {
    let keyObject = JSON.parse(await this.vue.$db.get('/account/controller/' + this.controllerAddress + '/keyObject'))
    privateKeys[this.controllerAddress] = '0x' + keythereum.recover(password, keyObject).toString('hex')
    this.consolidateMix()
  }

  lock() {
    delete privateKeys[this.controllerAddress]
  }

  isUnlocked() {
    return this.controllerAddress in privateKeys
  }

  _send(transaction, value = 0, checkBalance = true, gas = 200000) {
    return new Promise(async (resolve, reject) => {
      if (!this.isUnlocked()) {
        this.vue.$buefy.toast.open({message: 'Account is locked', type: 'is-danger'})
        reject()
        return
      }
      let nonce = await this.vue.$mixClient.web3.eth.getTransactionCount(this.controllerAddress)
      let data = await transaction.encodeABI()
      let rawTx = {
        nonce: nonce,
        from: this.controllerAddress,
        to: this.contractAddress,
        gasPrice: '0x3b9aca00',
        data: data,
        value: this.vue.$mixClient.web3.utils.toHex(value),
      }
      rawTx.gas = gas//await this.vue.$mixClient.web3.eth.estimateGas(rawTx)
      // Check if there is sufficient balance.
      let toBN = this.vue.$mixClient.web3.utils.toBN
      let controllerBalance = toBN(await this.getUnconfirmedControllerBalance())
      let requiredBalance = toBN(rawTx.gas).mul(toBN('1000000000'))
      if (checkBalance && controllerBalance.lt(requiredBalance)) {
        this.vue.$buefy.toast.open({message: 'Insufficient MIX', type: 'is-danger'})
        reject()
        return
      }
      let tx = new ethTx(rawTx)
      let privateKey = privateKeys[this.controllerAddress]
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
    return new Promise(async (resolve, reject) => {
      if (!this.contractAddress) {
        resolve()
        return
      }
      let balance = await this.vue.$mixClient.web3.eth.getBalance(this.contractAddress, 'pending')
      if (balance > 0) {
        let tx = await this._send(this.contract.methods.withdraw(), 0, false)
        await this._logTransaction(tx, '', 'Consolidate MIX')
        resolve()
      }
      else {
        resolve()
      }
    })
  }

  async getSendMixGas(to, value) {
    // Check if the destination is a contract.
    if (await this.vue.$mixClient.web3.eth.getCode(to) == '0x') {
      return 21000
    }
    return 200000
/*
    let nonce = await this.vue.$mixClient.web3.eth.getTransactionCount(this.controllerAddress)
    let data = await this.contract.methods.sendMix(to).encodeABI()
    let rawTx = {
      nonce: nonce,
      from: this.controllerAddress,
      to: this.contractAddress,
      gasPrice: '0x3b9aca00',
      data: data,
      value: this.vue.$mixClient.web3.utils.toHex(value),
    }
    return this.vue.$mixClient.web3.eth.estimateGas(rawTx)
*/
  }

  async sendMix(to, value) {
    // Check if the destination is a contract.
    let data = await this.vue.$mixClient.web3.eth.getCode(to)
    if (data == '0x') {
      // Send to a non-contract address.
      return new Promise(async (resolve, reject) => {
        if (!this.isUnlocked()) {
          this.vue.$buefy.toast.open({message: 'Account is locked', type: 'is-danger'})
          reject()
          return
        }
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
        let privateKey = privateKeys[this.controllerAddress]
        tx.sign(Buffer.from(privateKey.substr(2), 'hex'))
        let serializedTx = tx.serialize()
        this.vue.$mixClient.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
        .on('transactionHash', async transactionHash => {
          transaction = await this.vue.$mixClient.web3.eth.getTransaction(transactionHash)
          this._logTransaction(transaction, to, 'Send MIX')
          resolve(transaction)
        })
      })
    }
    else {
      // Send to a contract address.
      let transaction = await this._send(this.contract.methods.sendMix(to), value)
      this._logTransaction(transaction, to, 'Send MIX')
      return transaction
    }
  }

  async sendData(contract, method, params, value, description, gas) {
    let to = contract.options.address
    let data = contract.methods[method].apply(this, params).encodeABI()
    // Test this transaction.
    let success = await this.contract.methods.sendData(to, data).call({
      from: this.controllerAddress,
      value: this.vue.$mixClient.web3.utils.toHex(value),
    })
    if (!success) {
      this.vue.$buefy.toast.open({message: 'Transaction error', type: 'is-danger'})
      return
    }
    let transaction = await this._send(this.contract.methods.sendData(to, data), value, true, gas)
    this._logTransaction(transaction, to, description)
    return transaction
  }

  getControllerBalance() {
    return this.vue.$mixClient.web3.eth.getBalance(this.controllerAddress, 'latest')
  }

  getUnconfirmedControllerBalance() {
    return this.vue.$mixClient.web3.eth.getBalance(this.controllerAddress, 'pending')
  }

  async getBalance() {
    let toBN = this.vue.$mixClient.web3.utils.toBN
    let balance = toBN(await this.vue.$mixClient.web3.eth.getBalance(this.controllerAddress, 'latest'))

    if (this.contractAddress) {
      balance = balance.add(toBN(await this.vue.$mixClient.web3.eth.getBalance(this.contractAddress, 'latest')))
    }

    return balance
  }

  async getUnconfirmedBalance() {
    let toBN = this.vue.$mixClient.web3.utils.toBN
    let balance = toBN(await this.vue.$mixClient.web3.eth.getBalance(this.controllerAddress, 'pending'))

    if (this.contractAddress) {
      balance = balance.add(toBN(await this.vue.$mixClient.web3.eth.getBalance(this.contractAddress, 'pending')))
    }

    return balance
  }

  async getTransactionInfo(nonce) {
    let infoJson = await this.vue.$db.get('/account/controller/' + this.controllerAddress + '/transaction/' + nonce)
    let info = JSON.parse(infoJson)

    let receipt = this.vue.$mixClient.web3.eth.getTransactionReceipt(info.hash)
    let transaction = this.vue.$mixClient.web3.eth.getTransaction(info.hash)
    info.receipt = await receipt

    if (info.receipt)  {
      info.block = await this.vue.$mixClient.web3.eth.getBlock(info.receipt.blockNumber)

      let events = await this.contract.getPastEvents('CallFailed', {
        fromBlock: info.receipt.blockNumber,
        toBlock: info.receipt.blockNumber,
      })

      for (let event of events) {
        if (event.transactionHash == info.hash) {
          try {
            let encoded = '0x' + event.returnValues.returnData.slice(10)
            info.error = this.vue.$mixClient.web3.eth.abi.decodeParameter('string', encoded)
          }
          catch (e) {
            info.error = 'Unknown.'
          }
        }
      }
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
