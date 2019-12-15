const Web3 = require('web3')
const ethers = require('ethers')
const { getSteamUserClients } = require('./steam')
const Scanner = require('./scanner')
const log = require('./log')
const csgoTradeContract = require('./contracts/CSGOSteamTrade')
const utils = require('./utils')


function to0xHexString(decimal) {
  return `0x${parseInt(decimal).toString(16)}`
}

class ListingManager {

  constructor(rpc, contractAddress, credentials) {
    this.rpc = rpc
    this.contractAddress = contractAddress
    this.credentials = credentials
  }

  async setup(loadSteam) {
    loadSteam = loadSteam || false

    const provider = new ethers.providers.JsonRpcProvider(this.rpc)
    log.info(`Provider loaded.`)

    this.wallet = new ethers.Wallet(this.credentials.ethPrivateKey, provider)

    this.contract = new ethers.Contract(this.contractAddress, csgoTradeContract.abi, this.wallet)

    const listingsCount = await this.contract.getListingsCount()
    log.info(`Current Listings count: ${listingsCount}`)

    if (loadSteam) {
      try {
        this.steamClients = await getSteamUserClients(this.credentials)
        this.steamScanner = new Scanner(this.steamClients.csgo)
        log.info(`User ${this.credentials.accountName} logged on successfully.`)
      } catch(e) {
        log.error(`Failed to initialize steam user: ${e.stack}`)
        throw e
      }
    }

  }

  async createListings(listings) {

    const inventory = await new Promise((resolve, reject) => {
      this.steamClients.tradeOfferManager.getInventoryContents(
        utils.CSGO_APP_ID, utils.CSGO_CONTEXT_ID, false, (err, inventory) => {
          if (err) {
            reject(err)
          } else {
            resolve(inventory)
          }
        })
    })

    for (const listing of listings) {
      log.info(`Processing listing ${JSON.stringify(listing)}`)

      const [inspectLink, price] = listing.split(',')

      const smad = utils.inspectLinkToSMAD(inspectLink)
      const inventoryItem = inventory.filter(item => item.assetid === smad.a)[0]
      if (!inventoryItem) {
        const error = `Item with inspect link ${inspectLink} cannot be found in the current inventory for ${this.credentials.accountName}`
        log.error(error)
        continue
      }

      const itemData = await this.steamScanner.scanInspectLink(inspectLink)

      const extraItemData = JSON.stringify({
        statTrak: false,
        image: inventoryItem.getImageURL()
      })

      const sellerEthereumAdress = this.wallet.address
      const paintSeed = itemData.paintseed.toString()
      const wear = itemData.paintwear.toString()
      const skinName = inventoryItem.market_hash_name
      try {
        const r = await this.contract.createListing(inspectLink, wear,
          skinName, paintSeed, extraItemData, price, sellerEthereumAdress, {
            gasLimit: to0xHexString('6721975'),
            gasPrice: to0xHexString('20000000000'),
          })
        log.info(r)
      } catch (e) {
        log.error(`Failed to create listing for ${inspectLink} with ${e.stack}`)
        continue
      }
    }
  }

  async validateItemDelivery(listingId) {

  }

  async getListings() {

  }

  async deleteListing(listingId) {

  }

}

module.exports = ListingManager
