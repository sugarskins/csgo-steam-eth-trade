'use strict'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const h = require('chainlink-test-helpers')

contract('CSGOSteamTrade', accounts => {
  const LinkToken = artifacts.require('LinkToken.sol')
  const Oracle = artifacts.require('Oracle.sol')
  const CSGOSteamTrade = artifacts.require('CSGOSteamTrade.sol')

  const defaultAccount = accounts[0]
  const oracleNode = accounts[1]
  const stranger = accounts[2]
  const consumer = accounts[3]

  const seller = accounts[4]
  const buyer = accounts[5]

  // These parameters are used to validate the data was received
  // on the deployed oracle contract. The Job ID only represents
  // the type of data, but will not work on a public testnet.
  // For the latest JobIDs, visit our docs here:
  // https://docs.chain.link/docs/testnet-oracles
  const jobId = web3.utils.toHex('4c7b7ffb66b344fbaa64995af81e355a')
  const url =
    'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD,EUR,JPY'
  const path = 'USD'
  const times = 100

    // Represents 1 LINK for testnet requests
    const payment = web3.utils.toWei('1')


  let csGOContract = null
  let linkToken = null
  let oracleContract = null

  beforeEach(async () => {
    linkToken = await LinkToken.new()
    oracleContract = await Oracle.new(linkToken.address, { from: defaultAccount })
    csGOContract = await CSGOSteamTrade.new(linkToken.address, { from: consumer })
    await oracleContract.setFulfillmentPermission(oracleNode, true, {
      from: defaultAccount,
    })
  })
  describe('#createListing', () => {
    beforeEach(async () => {
    })

    context('on a contract with no previous history', () => {
      it('can create a new listing and emits creation event', async () => {
        
        let accountSteamId = '1915645022323022857'
        let wear = '0.0356150865554809600000000'
        let skinName = 'StatTrak™ M4A4 | Desert-Strike (Factory New)'
        let price = '150000000000000000'
        let ownerSteamAccountName = 'steamedbuns'
        let paintSeed = 210
        let sellerEthereumAdress = seller
      
        const r = await csGOContract.createListing(ownerSteamAccountName, accountSteamId, wear,
          skinName, paintSeed, price, sellerEthereumAdress, {from: seller })
        const creationEventLog = r.logs[0].args.listing
        assert.equal(r.receipt.status, true)

        assert.equal(creationEventLog.accountSteamId, accountSteamId)
        assert.equal(creationEventLog.wear, wear)
        assert.equal(creationEventLog.skinName, skinName)
        assert.equal(creationEventLog.price, price)
        assert.equal(creationEventLog.owner, seller)
        assert.equal(creationEventLog.sellerEthereumAdress, seller)
      })

      it('fetches created listing by id', async () => {

        const accountSteamId = '1915645022323022857'
        const wear = '0.0356150865554809600000000'
        const skinName = 'StatTrak™ M4A4 | Desert-Strike (Factory New)'
        const price = '100000000000000000'
        const ownerSteamAccountName = 'steamedbuns'
        const paintSeed = 210
        const sellerEthereumAdress = seller
        const createListingTx = await csGOContract.createListing(ownerSteamAccountName, accountSteamId, wear,
          skinName, paintSeed, price, sellerEthereumAdress, { from: seller })

        const createdListingId = parseInt(createListingTx.logs[0].args.listing.listingId)
        const stored = await csGOContract.getListing.call(createdListingId)

        assert.equal(stored.accountSteamId, accountSteamId)
        assert.equal(stored.wear, wear)
        assert.equal(stored.skinName, skinName)
        assert.equal(stored.price, price)
        assert.equal(stored.sellerEthereumAdress, sellerEthereumAdress)
        assert.equal(stored.owner, seller)
        assert.equal(stored.exists, true)
      })
    })
  })

  describe('#createPurchaseOffer', () => {
    context('on a contract with an existing listing', () => {
      const accountSteamId = '1915645022323022857'
      const wear = '0.0356150865554809600000000'
      const skinName = 'StatTrak™ M4A4 | Desert-Strike (Factory New)'
      const price = '100000000000000000'
      const ownerSteamAccountName = 'steamedbuns'
      const paintSeed = 210
      const sellerEthereumAdress = seller

      const buyerSteamAccountName = 'iwantyourwep'
      const buyerAccountSteamId = '1915645022323022856'
  
      beforeEach(async () => {
        await csGOContract.createListing(ownerSteamAccountName, accountSteamId, wear,
          skinName, paintSeed, price, sellerEthereumAdress, { from: seller })
      })
      it('creates a purchase offer for the listing', async () => {
        const listingId = 0
        await csGOContract.createPurchaseOffer(listingId, buyerSteamAccountName, buyerAccountSteamId, {
          from: buyer,
          value: price
        })

        const stored = await csGOContract.getListing.call(listingId)
        const updatedOffer = stored.purchaseOffer
        assert.equal(stored.accountSteamId, accountSteamId)
        assert.equal(stored.wear, wear)
        assert.equal(stored.skinName, skinName)
        assert.equal(stored.price, price)
        assert.equal(stored.sellerEthereumAdress, sellerEthereumAdress)
        assert.equal(stored.owner, seller)
        assert.equal(stored.exists, true)
        
        assert.equal(updatedOffer.owner, buyer)
        assert.equal(updatedOffer.buyerSteamAccountName, buyerSteamAccountName)
        assert.equal(updatedOffer.exists, true)
      })
    })
  })

  describe('#createItemTransferConfirmationRequest', () => {
    context('a contract with an existing listing with a matching valid purchase offer', () => {
      const accountSteamId = '1915645022323022857'
      const wear = '0.0356150865554809600000000'
      const skinName = 'StatTrak™ M4A4 | Desert-Strike (Factory New)'
      const price = '100000000000000000'
      const ownerSteamAccountName = 'steamedbuns'
      const paintSeed = 210
      const sellerEthereumAdress = seller
  
      const buyerSteamAccountName = 'iwantyourwep'
      const buyerAccountSteamId = '1915645022323022856'

      let listingId = 0
  
      beforeEach(async () => {
        await linkToken.transfer(csGOContract.address, web3.utils.toWei('1', 'ether'))
        await csGOContract.createListing(ownerSteamAccountName, accountSteamId, wear,
          skinName, paintSeed, price, sellerEthereumAdress, { from: seller })
        listingId = 0
        await csGOContract.createPurchaseOffer(listingId, buyerSteamAccountName, buyerAccountSteamId, {
            from: buyer,
            value: price
          })
      })
      it('triggers transfer confirmation request for the existing listing', async () => {
        const tx = await csGOContract.createItemTransferConfirmationRequest(
          listingId,
          oracleContract.address,
          jobId,
          payment,
          url,
          path,
          { from: seller },
        )
        const request = h.decodeRunRequest(tx.receipt.rawLogs[3])
        console.log(request)
        assert.equal(oracleContract.address, tx.receipt.rawLogs[3].address)
        assert.equal(
          request.topic,
          web3.utils.keccak256(
            'OracleRequest(bytes32,address,bytes32,uint256,address,bytes4,uint256,uint256,bytes)',
          ),
        )

        const expected = 1
        const response = web3.utils.toHex(expected)
        await h.fulfillOracleRequest(oracleContract, request, response, { from: oracleNode })

        const postConfirmationListing = await csGOContract.getListing.call(listingId)
        console.log(postConfirmationListing)
      })
    })
  })
})