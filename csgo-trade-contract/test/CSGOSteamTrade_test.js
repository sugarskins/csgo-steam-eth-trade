'use strict'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const h = require('chainlink-test-helpers')

contract('CSGOSteamTrade', accounts => {
  const LinkToken = artifacts.require('LinkToken.sol')
  const Oracle = artifacts.require('Oracle.sol')
  const CSGOSteamTrade  = artifacts.require('CSGOSteamTrade.sol')

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
    // Represents 1 LINK for testnet requests
    const payment = web3.utils.toWei('1')


  let csGOContract = null
  let linkToken = null
  let oracleContract = null

  const listing1 = {
    wear: '0.0356150865554809600000000',
    skinName: 'StatTrak™ M4A4 | Desert-Strike (Factory New)',
    price: '150000000000000000',
    extraItemData: '{ "statTrak": true }',
    ownerInspectLink: 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198862566094A16975411865D479860722137102858',
    paintSeed: 210,
    sellerEthereumAdress: seller
  }

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
        
        const r = await csGOContract.createListing(listing1.ownerInspectLink, listing1.wear,
          listing1.skinName, listing1.paintSeed, listing1.extraItemData, listing1.price,
          listing1.sellerEthereumAdress, {from: seller })
        const creationEventLog = r.logs[0].args.listing
        assert.equal(r.receipt.status, true)

        assert.equal(creationEventLog.ownerInspectLink, listing1.ownerInspectLink)
        assert.equal(creationEventLog.wear, listing1.wear)
        assert.equal(creationEventLog.skinName, listing1.skinName)
        assert.equal(creationEventLog.price, listing1.price)
        assert.equal(creationEventLog.owner, listing1.sellerEthereumAdress)
        assert.equal(creationEventLog.sellerEthereumAdress, listing1.sellerEthereumAdress)
      })

      it('fetches created listing by id', async () => {
        const createListingTx = await csGOContract.createListing(listing1.ownerInspectLink, listing1.wear,
          listing1.skinName, listing1.paintSeed, listing1.extraItemData, listing1.price,
          listing1.sellerEthereumAdress, { from: seller })

        const createdListingId = parseInt(createListingTx.logs[0].args.listing.listingId)
        const stored = await csGOContract.getListing.call(createdListingId)

        assert.equal(stored.ownerInspectLink, listing1.ownerInspectLink)
        assert.equal(stored.wear, listing1.wear)
        assert.equal(stored.skinName, listing1.skinName)
        assert.equal(stored.price, listing1.price)
        assert.equal(stored.sellerEthereumAdress, listing1.sellerEthereumAdress)
        assert.equal(stored.owner, seller)
        assert.equal(stored.exists, true)
      })
    })
  })

  describe('#createPurchaseOffer', () => {
    context('on a contract with an existing listing', () => {
      const wear = '0.0356150865554809600000000'
      const skinName = 'StatTrak™ M4A4 | Desert-Strike (Factory New)'
      const price = '100000000000000000'
      const ownerInspectLink = 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198862566094A16975411865D479860722137102858'
      const extraItemData = '{ "statTrak": true }'
      const paintSeed = 210
      const sellerEthereumAdress = seller

      const buyerTradeURL = 'https://steamcommunity.com/tradeoffer/new/?partner=902300366&token=HYgPwBhA'
  
      beforeEach(async () => {
        await csGOContract.createListing(ownerInspectLink, wear,
          skinName, paintSeed, extraItemData, price, sellerEthereumAdress, { from: seller })
      })
      it('creates a purchase offer for the listing', async () => {
        const listingId = 0
        await csGOContract.createPurchaseOffer(listingId, buyerTradeURL, {
          from: buyer,
          value: price
        })

        const stored = await csGOContract.getListing.call(listingId)
        const updatedOffer = stored.purchaseOffer
        assert.equal(stored.ownerInspectLink, ownerInspectLink)
        assert.equal(stored.wear, wear)
        assert.equal(stored.skinName, skinName)
        assert.equal(stored.price, price)
        assert.equal(stored.sellerEthereumAdress, sellerEthereumAdress)
        assert.equal(stored.owner, seller)
        assert.equal(stored.exists, true)
        
        assert.equal(updatedOffer.owner, buyer)
        assert.equal(updatedOffer.buyerTradeURL, buyerTradeURL)
        assert.equal(updatedOffer.exists, true)
      })
    })
  })

  describe('#createItemTransferConfirmationRequest', () => {
    context('a contract with an existing listing with a matching valid purchase offer', () => {
      const wear = '0.0356150865554809600000000'
      const skinName = 'StatTrak™ M4A4 | Desert-Strike (Factory New)'
      const price = '100000000000000000'
      const extraItemData = '{ "statTrak": true }'
      const ownerInspectLink = 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198862566094A16975411865D479860722137102858'
      const buyerInspectLink = 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198266545231A16941417193D7840463547991005224'
      const paintSeed = 210
      const sellerEthereumAdress = seller
  
      const buyerTradeURL = 'https://steamcommunity.com/tradeoffer/new/?partner=902300366&token=HYgPwBhA'

      let listingId = 0
  
      beforeEach(async () => {
        await linkToken.transfer(csGOContract.address, web3.utils.toWei('1', 'ether'))
        await csGOContract.createListing(ownerInspectLink, wear,
          skinName, paintSeed, extraItemData, price, sellerEthereumAdress, { from: seller })
        listingId = 0
        await csGOContract.createPurchaseOffer(listingId, buyerTradeURL, {
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
          buyerInspectLink,
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