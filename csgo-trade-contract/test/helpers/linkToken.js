const bn = require('bn.js')
const truffle_contract = require('truffle-contract')
const LinkToken_json = require('./LinkToken.json')

exports.linkContract = async account => {
  if (!account) {
    throw Error('No account supplied as a parameter')
  }

  const web3Contract = new web3.eth.Contract(LinkToken_json.abi)
  web3Contract.options.data = LinkToken_json.bytecode


  const receipt = await web3.eth.sendTransaction({
    data: web3Contract.deploy({
      arguments: []
    }).encodeABI(),
    from: account,
    gas: 2000000,
  })
  const contract = truffle_contract({ abi: LinkToken_json.abi })
  contract.setProvider(web3.currentProvider)
  contract.defaults({
    from: account,
    gas: 3500000,
    gasPrice: 10000000000,
  })
  return await contract.at(receipt.contractAddress)
}
