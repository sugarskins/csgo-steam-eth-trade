
contract('CSGOSteamTrade', accounts => {
  const CSGOSteamTrade = artifacts.require('CSGOSteamTrade.sol')

  const defaultAccount = accounts[0]
  const oracleNode = accounts[1]
  const stranger = accounts[2]
  const consumer = accounts[3]

  const seller = accounts[4]
  const buyer = accounts[5]

  let csGOContract = null

  beforeEach(async () => {
    csGOContract = await CSGOSteamTrade.new({ from: consumer })
  })
  describe('#createListing', () => {
    beforeEach(async () => {
    })

    context('when there are 0 listings currently', () => {
      it('can create a new listing and emits creation event', async () => {
        
        let marketId = '1915645022323022857'
        let wear = '0.0356150865554809600000000'
        let skinName = 'StatTrak™ M4A4 | Desert-Strike (Factory New)'
        let price = '150000000000000000'
        let ownerSteamAccountName = 'steamedbuns'
        let paintSeed = 210
        let sellerEthereumAdress = seller
      
        const r = await csGOContract.createListing(ownerSteamAccountName, marketId, wear,
          skinName, paintSeed, price, sellerEthereumAdress, {from: seller })
        const creationEventLog = r.logs[0].args.listing
        assert.equal(r.receipt.status, true)

        assert.equal(creationEventLog.marketId, marketId)
        assert.equal(creationEventLog.wear, wear)
        assert.equal(creationEventLog.skinName, skinName)
        assert.equal(creationEventLog.price, price)
        assert.equal(creationEventLog.owner, seller)
        assert.equal(creationEventLog.sellerEthereumAdress, seller)
      })

      it('fetches created listing by id', async () => {

        let marketId = '1915645022323022857'
        let wear = '0.0356150865554809600000000'
        let skinName = 'StatTrak™ M4A4 | Desert-Strike (Factory New)'
        let price = '100000000000000000'
        let ownerSteamAccountName = 'steamedbuns'
        let paintSeed = 210
        let sellerEthereumAdress = seller
        let createListingTx = await csGOContract.createListing(ownerSteamAccountName, marketId, wear,
          skinName, paintSeed, price, sellerEthereumAdress, { from: seller })

        const createdListingId = parseInt(createListingTx.logs[0].args.listing.listingId)
        const stored = await csGOContract.getListing.call(createdListingId)

        assert.equal(stored.marketId, marketId)
        assert.equal(stored.wear, wear)
        assert.equal(stored.skinName, skinName)
        assert.equal(stored.price, price)
        assert.equal(stored.sellerEthereumAdress, sellerEthereumAdress)
        assert.equal(stored.owner, seller)
        assert.equal(stored.exists, true)
      })
    })
  })

})