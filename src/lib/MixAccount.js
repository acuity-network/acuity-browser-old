const accountAbi = require('./Account.abi.json')

export default class MixAccount {

  constructor(vue, controllerAddress) {
    this.vue = vue
    this.controllerAddress = controllerAddress
  }

  init() {
    return this.vue.$db.get('/account/controller/' + this.controllerAddress + '/contract')
    .then(contractAddress => {
      this.contractAddress = contractAddress
      this.contract = new this.vue.$web3.eth.Contract(accountAbi, contractAddress)
      return this
    })
    .catch(() => {})
  }

  _logTransaction(transaction, to, description) {
    var info = {
      hash: transaction.hash,
      to: to,
      description: description,
    }
    return this.vue.$db.put('/account/controller/' + this.controllerAddress + '/transaction/' + transaction.nonce, JSON.stringify(info))
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
      })
      .on('receipt', receipt => {
        console.log(receipt)
        this.contractAddress = receipt.contractAddress
        this.vue.$db.batch()
        .put('/account/controller/' + this.controllerAddress + '/contract', this.contractAddress)
        .put('/account/contract/' + this.contractAddress + '/controller', this.controllerAddress)
        .write()
      })
      .then(newContractInstance => {
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

  isUnlocked() {
    return this.vue.$web3.eth.sign('', this.controllerAddress)
    .then(() => {
      return true
    })
    .catch(() => {
      return false
    })
  }

  _send(transaction, value) {
    return new Promise((resolve, reject) => {
      transaction.estimateGas({
        from: this.controllerAddress,
        value: value,
      })
      .then(gas => {
        transaction.send({
          from: this.controllerAddress,
          gasPrice: 1,
          gas: gas,
          value: value,
        })
        .on('transactionHash', transactionHash => {
          this.vue.$web3.eth.getTransaction(transactionHash)
          .then(transaction => {
            resolve(transaction)
          })
        })
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

  sendMix(to, value) {
    // Check if the destination is a contract.
    return this.vue.$web3.eth.getCode(to)
    .then(data => {
      if (data == '0x') {
        // Send to a non-contract address.
        return new Promise((resolve, reject) => {
          this.vue.$web3.eth.sendTransaction({
            from: this.controllerAddress,
            to: to,
            value: value,
            gas: 21000,
            gasPrice: 1,
          })
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
    })
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

  getTransactionInfo(nonce) {
    return this.vue.$db.get('/account/controller/' + this.controllerAddress + '/transaction/' + nonce)
    .then(infoJson => {
      var info = JSON.parse(infoJson)
      return Promise.all([
        this.vue.$web3.eth.getTransaction(info.hash),
        this.vue.$web3.eth.getTransactionReceipt(info.hash),
      ])
      .then(results => {
        info.transaction = results[0]
        info.receipt = results[1]
        if (info.receipt) {
          return this.vue.$web3.eth.getBlock(info.receipt.blockNumber)
          .then(block => {
            info.block = block
            return info
          })
        }
        else {
          return info
        }
      })
    })
  }

  async getTrustedThatTrust(address) {
    return await this.call(this.vue.$trustedAccounts.methods.getTrustedThatTrustAccount(address))
  }

}
