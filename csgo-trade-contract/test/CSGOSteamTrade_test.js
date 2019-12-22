'use strict'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const h = require('chainlink-test-helpers')
const truffleAssert = require('truffle-assertions')
const truffleTestUtils = require('./truffleTestUtils')
const BigNumber = require('bignumber.js')


async function getTxCost(txResult) {
  const tx = await web3.eth.getTransaction(txResult.tx)
  return (BigNumber(txResult.receipt.gasUsed)).multipliedBy(BigNumber(tx.gasPrice))
 }

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
  let minimumAgeForPurchaseDeletion = null

  const listing1 = {
    wear: '0.0356150865554809600000000',
    skinName: 'StatTrak™ M4A4 | Desert-Strike (Factory New)',
    price: '150000000000000000',
    extraItemData: '{ "statTrak": true }',
    ownerInspectLink: 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198862566094A16975411865D479860722137102858',
    paintSeed: 210,
    sellerAddress: seller
  }

  const listing2 = {
    ownerInspectLink: 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198862566094A17372518075D11710184251699433565',
    wear: '0.7134350538253784',
    skinName: 'MAG-7 | Rust Coat (Battle-Scarred)',
    price: '120000000000000000',
    paintSeed: 178,
    extraItemData: '{"statTrak":false }',
    sellerAddress: seller
  }

  const listing3 = {
    ownerInspectLink: 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198862566094A17372520653D4630342583408093179',
    wear: '0.6625427603721619',
    skinName: 'MP5-SD | Dirt Drop (Battle-Scarred)',
    price: '130000000000000000',
    paintSeed: 17,
    extraItemData: '{"statTrak":false}',
    sellerAddress: seller
  }

  beforeEach(async () => {
    linkToken = await LinkToken.new()
    oracleContract = await Oracle.new(linkToken.address, { from: defaultAccount })
    csGOContract = await CSGOSteamTrade.new(linkToken.address, { from: seller })
    await oracleContract.setFulfillmentPermission(oracleNode, true, {
      from: defaultAccount,
    })

    const minimumAgeForDeletionObject = await csGOContract.MINIMUM_PURCHASE_OFFER_AGE.call()
    minimumAgeForPurchaseDeletion = parseInt(minimumAgeForDeletionObject.toString())
  })
  describe('#createListing', () => {
    context('on a contract with no previous history', () => {
      it('can create a new listing and emits creation event', async () => {
        
        const r = await csGOContract.createListing(listing1.ownerInspectLink, listing1.wear,
          listing1.skinName, listing1.paintSeed, listing1.extraItemData, listing1.price,
          listing1.sellerAddress, {from: seller })
        const creationEventLog = r.logs[0].args.listing
        assert.equal(r.receipt.status, true)

        assert.equal(creationEventLog.ownerInspectLink, listing1.ownerInspectLink)
        assert.equal(creationEventLog.wear, listing1.wear)
        assert.equal(creationEventLog.skinName, listing1.skinName)
        assert.equal(creationEventLog.price, listing1.price)
        assert.equal(creationEventLog.sellerAddress, listing1.sellerAddress)
      })

      it('creates a new listing which ca be fetched by id and properties match', async () => {
        const createListingTx = await csGOContract.createListing(listing1.ownerInspectLink, listing1.wear,
          listing1.skinName, listing1.paintSeed, listing1.extraItemData, listing1.price,
          listing1.sellerAddress, { from: seller })

        const createdListingId = parseInt(createListingTx.logs[0].args.listing.listingId)
        const stored = await csGOContract.getListing.call(createdListingId)

        assert.equal(stored.ownerInspectLink, listing1.ownerInspectLink)
        assert.equal(stored.wear, listing1.wear)
        assert.equal(stored.skinName, listing1.skinName)
        assert.equal(stored.price, listing1.price)
        assert.equal(stored.sellerAddress, listing1.sellerAddress)
        assert.equal(stored.exists, true)
      })

      it('creates 3 listings in a row with incrementing ids', async () => {
        let expectedListingId = 0
        const listings = [listing1, listing2, listing3]
        for (const listing of listings) {
          const createListingTx = await csGOContract.createListing(listing.ownerInspectLink, listing.wear,
            listing.skinName, listing.paintSeed, listing.extraItemData, listing.price,
            listing.sellerAddress, { from: seller })
            const createdListingId = parseInt(createListingTx.logs[0].args.listing.listingId)
            assert.equal(createdListingId, expectedListingId++)
        }

        for (let i = 0; i < listings.length; i++) {
          const listing = listings[i]
          const stored = await csGOContract.getListing(i)
          assert.equal(stored.ownerInspectLink, listing.ownerInspectLink)
          assert.equal(stored.wear, listing.wear)
          assert.equal(stored.skinName, listing.skinName)
          assert.equal(stored.price, listing.price)
          assert.equal(stored.sellerAddress, listing.sellerAddress)
          assert.equal(stored.exists, true)
        }
      })
    })
  })

  describe('#createPurchaseOffer', () => {
    context('on a contract with an existing listing', () => {
      const buyerTradeURL = 'https://steamcommunity.com/tradeoffer/new/?partner=902300366&token=HYgPwBhA'
      
      let listingId = null
      const listing = listing1
      beforeEach(async () => {
        const createListingTx = await csGOContract.createListing(listing1.ownerInspectLink, listing1.wear,
          listing1.skinName, listing1.paintSeed, listing1.extraItemData, listing1.price,
          listing1.sellerAddress, { from: seller })
        listingId = parseInt(createListingTx.logs[0].args.listing.listingId)
      })
      it('creates a purchase offer for the listing and the contract balance increases with the price', async () => {
        await csGOContract.createPurchaseOffer(listingId, buyerTradeURL, {
          from: buyer,
          value: listing1.price
        })

        const stored = await csGOContract.getListing.call(listingId)
        const updatedOffer = stored.purchaseOffer
        assert.equal(stored.ownerInspectLink, listing1.ownerInspectLink)
        assert.equal(stored.wear, listing1.wear)
        assert.equal(stored.skinName, listing1.skinName)
        assert.equal(stored.price, listing1.price)
        assert.equal(stored.sellerAddress, listing1.sellerAddress)
        assert.equal(stored.exists, true)
        
        assert.equal(updatedOffer.owner, buyer)
        assert.equal(updatedOffer.buyerTradeURL, buyerTradeURL)
        assert.equal(updatedOffer.exists, true)

        const contractBalance = await web3.eth.getBalance(csGOContract.address)
        assert.equal(contractBalance, listing1.price)
      })

      it('fails to create a purchase offer when a listing already has one', async () => {
        await csGOContract.createPurchaseOffer(listingId, buyerTradeURL, {
          from: buyer,
          value: listing.price
        })
        
        await truffleAssert.reverts(
          csGOContract.createPurchaseOffer(listingId, buyerTradeURL, {
            from: buyer,
            value: listing.price
          }))
      })
    })
  })

  describe('#deleteListing', () => {

    context('on a contract with no previous history', () => {
      it('can delete existing listing', async () => {
        const createListingTx = await csGOContract.createListing(listing1.ownerInspectLink, listing1.wear,
          listing1.skinName, listing1.paintSeed, listing1.extraItemData, listing1.price,
          listing1.sellerAddress, { from: seller })

        const createdListingId = parseInt(createListingTx.logs[0].args.listing.listingId)

        const storedBeforeDeletion = await csGOContract.getListing(createdListingId)
        assert.equal(storedBeforeDeletion.exists, true)

        await csGOContract.deleteListing(createdListingId, { from: seller })

        const stored = await csGOContract.getListing(createdListingId)
        assert.equal(stored.exists, false)
      })

      it('a stranger cannot delete an existing listing he does not own', async () => {
        const createListingTx = await csGOContract.createListing(listing1.ownerInspectLink, listing1.wear,
          listing1.skinName, listing1.paintSeed, listing1.extraItemData, listing1.price,
          listing1.sellerAddress, { from: seller })

        const createdListingId = parseInt(createListingTx.logs[0].args.listing.listingId)

        const storedBeforeDeletion = await csGOContract.getListing(createdListingId)
        assert.equal(storedBeforeDeletion.exists, true)

        await truffleAssert.reverts(
          csGOContract.deleteListing(createdListingId, { from: stranger }))

        const stored = await csGOContract.getListing(createdListingId)
        assert.equal(stored.exists, true)
      })

      it('a seller cannot delete a listing twice', async () => {
        const createListingTx = await csGOContract.createListing(listing1.ownerInspectLink, listing1.wear,
          listing1.skinName, listing1.paintSeed, listing1.extraItemData, listing1.price,
          listing1.sellerAddress, { from: seller })

        const createdListingId = parseInt(createListingTx.logs[0].args.listing.listingId)
        await csGOContract.deleteListing(createdListingId, { from: seller })

        const stored = await csGOContract.getListing(createdListingId)
        assert.equal(stored.exists, false)

        await truffleAssert.reverts(
          csGOContract.deleteListing(createdListingId, { from: seller }))
      })
    })

    it('deletes an existing listing with a purchase offer and refunds the buyer', async () => {
      const buyerTradeURL = 'https://steamcommunity.com/tradeoffer/new/?partner=902300366&token=HYgPwBhA'
      const createListingTx = await csGOContract.createListing(listing1.ownerInspectLink, listing1.wear,
        listing1.skinName, listing1.paintSeed, listing1.extraItemData, listing1.price,
        listing1.sellerAddress, { from: seller })
        
      const createdListingId = parseInt(createListingTx.logs[0].args.listing.listingId)

      await csGOContract.createPurchaseOffer(createdListingId, buyerTradeURL, {
        from: buyer,
        value: listing1.price
      })
      
      const balanceBefore = BigNumber(await web3.eth.getBalance(buyer))
      await csGOContract.deleteListing(createdListingId, { from: seller })
      const balanceAfter = BigNumber(await web3.eth.getBalance(buyer))

      assert.equal(balanceAfter.toFixed(), balanceBefore.plus(listing1.price).toFixed())
    })
  })


  describe('deletePurchaseOffer', () => {
    
    context('on a contract with an existing listing', () => {
      const buyerTradeURL = 'https://steamcommunity.com/tradeoffer/new/?partner=902300366&token=HYgPwBhA'
      const listing = listing1
      beforeEach(async () => {
        await csGOContract.createListing(listing.ownerInspectLink, listing.wear,
          listing.skinName, listing.paintSeed, listing.extraItemData, listing.price,
          listing.sellerAddress, { from: seller })
      })

      it('deletes a purchase offer for the listing after minimum time passed and refunds the buyer', async () => {
        const listingId = 0
        await csGOContract.createPurchaseOffer(listingId, buyerTradeURL, {
          from: buyer,
          value: listing.price
        })

        const balanceBefore = BigNumber(await web3.eth.getBalance(buyer))
        await truffleTestUtils.advanceTimeAndBlock(minimumAgeForPurchaseDeletion + 5)

        const result = await csGOContract.deletePurchaseOffer(listingId, {
          from: buyer
        })
        const txCost = await getTxCost(result)

        const storedAfterPurchaseOfferDeletion = await csGOContract.getListing.call(listingId)
        assert.equal(storedAfterPurchaseOfferDeletion.purchaseOffer.exists, false)

        const balanceAfter = BigNumber(await web3.eth.getBalance(buyer))
        assert.equal(balanceAfter.toFixed(), balanceBefore.plus(BigNumber(listing.price)).minus(txCost).toFixed())
      })

      it(`fails to delete a purchase offer who doesn't meet minimum age requirement`, async () => {
        const listingId = 0
        await csGOContract.createPurchaseOffer(listingId, buyerTradeURL, {
          from: buyer,
          value: listing.price
        })

        await truffleTestUtils.advanceTimeAndBlock(minimumAgeForPurchaseDeletion - 1000)

        await truffleAssert.reverts(
          csGOContract.deletePurchaseOffer(listingId, {
            from: buyer
          }))

        const storedAfterPurchaseOfferDeletion = await csGOContract.getListing.call(listingId)
        assert.equal(storedAfterPurchaseOfferDeletion.purchaseOffer.exists, true)
      })

      it(`fails to delete a purchase offer that does not belong to caller`, async () => {
        const listingId = 0
        await csGOContract.createPurchaseOffer(listingId, buyerTradeURL, {
          from: buyer,
          value: listing.price
        })

        await truffleTestUtils.advanceTimeAndBlock(minimumAgeForPurchaseDeletion + 5)
        
        await truffleAssert.reverts(
          csGOContract.deletePurchaseOffer(listingId, {
            from: stranger
          }))
      })

      it(`fails to delete a purchase offer of a listing that was deleted`, async () => {
        const listingId = 0
        await csGOContract.createPurchaseOffer(listingId, buyerTradeURL, {
          from: buyer,
          value: listing.price
        })
        await csGOContract.deleteListing(listingId, {
          from: seller
        })
        await truffleTestUtils.advanceTimeAndBlock(minimumAgeForPurchaseDeletion + 5)
        await truffleAssert.reverts(
          csGOContract.deletePurchaseOffer(listingId, {
            from: buyer
          }))
      })
    })
  })

  describe('#createItemTransferConfirmationRequest', () => {
    context('a contract with an existing listing with a matching valid purchase offer', () => {
      const buyerInspectLink = 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198266545231A16941417193D7840463547991005224'
      const buyerTradeURL = 'https://steamcommunity.com/tradeoffer/new/?partner=902300366&token=HYgPwBhA'
      let listingId = 0
  
      beforeEach(async () => {
        const listing = listing1
        await linkToken.transfer(csGOContract.address, web3.utils.toWei('1', 'ether'))
        await csGOContract.createListing(listing.ownerInspectLink, listing.wear,
          listing.skinName, listing.paintSeed, listing.extraItemData, listing.price,
          listing.sellerAddress, { from: seller })
        listingId = 0
        await csGOContract.createPurchaseOffer(listingId, buyerTradeURL, {
            from: buyer,
            value: listing.price
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
      })
    })
  })
})