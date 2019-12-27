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

const LISTING_FETCH_BATCH_SIZE = 50

const CHAIN_ID_TO_LINK_CONTRACT = {
  1: '0x514910771af9ca656af840dff83e8264ecf986ca',
  3: '0x20fe562d797a42dcb3399062ae9546cd06f63280'
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

    if (this.credentials) {
      this.wallet = new ethers.Wallet(this.credentials.ethPrivateKey, provider)
      this.contract = new ethers.Contract(this.contractAddress, csgoTradeContract.abi, this.wallet)
    } else {
      log.info(`Credentials not defined. Wallet won't be defined.`)
      this.contract = new ethers.Contract(this.contractAddress, csgoTradeContract.abi, provider)
    }

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

  async createListings(listings, dedupe) {
    dedupe = dedupe || false

    let currentListingsInspectLinks = null
    if (dedupe) {
      const currentListings = await this.getListings()
      // filter for listings that still exist and are not DONE
      currentListingsInspectLinks = new Set(
        currentListings
          .filter(l => l.exists === true && l.stage !== 4)
          .map(l => l.ownerInspectLink))
    }

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

      if (dedupe && currentListingsInspectLinks.has(inspectLink)) {
        log.info(`Skipping ${inspectLink} because there already exists an active listing with this inspectLink.`)
        continue
      }

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

  async getListings(filters) {
    const listingsCount = await this.contract.getListingsCount()
    log.debug(`Current listing count: ${listingsCount}`)

    const listingIds = []
    for (let i = 0; i < listingsCount; i++) {
      listingIds.push(i)
    }

    const batches = utils.makeGroups(listingIds, LISTING_FETCH_BATCH_SIZE)

    log.debug(`Fetching listings in ${batches.length} batches.`)

    let allListings = []
    for (const batch of batches) {
      const batchListings = await Promise.all(batch.map(listingId => this.contract.getListing(listingId)))
      allListings = allListings.concat(batchListings)
    }

    return allListings
  }

  async deleteListing(listingId) {
    return await this.contract.deleteListing(listingId,  {
      gasLimit: to0xHexString('6721975'),
      gasPrice: to0xHexString('20000000000'),
    })
  }

  async deleteListings(listingIds) {
    for (const listingId of listingIds) {
      log.info(`Deleting listing with Id ${listingId}`)
      try {
        const response = await this.deleteListing(listingId)
      } catch (e) {
        log.error(`Failed to delete listing ${listingId} with ${e.stack}`)
      }
    }
  }

  async validateItemDelivery(listingId, oracleAddress, jobId, buyerInspectLink) {
    log.info(`Processing listing ${listingId} with oracle at ${oracleAddress} and jobId ${jobId} for inspect link ${buyerInspectLink}`)

    const defaultLINKPayment = 10 ** 18
    await this.contract.createItemTransferConfirmationRequest(
      listingId, oracleAddress, jobId, defaultLINKPayment, buyerInspectLink, {
        gasLimit: to0xHexString('6721975'),
        gasPrice: to0xHexString('20000000000'),
      })

  }

  static async deployContract(rpc, credentials, linkContractAddress) {
    log.info(`Deploying contract to ${rpc}.`)


    const provider = new ethers.providers.JsonRpcProvider(rpc)
    log.info(`Provider loaded.`)

    if (!linkContractAddress) {
      const chainId = provider.chainId
      linkContractAddress = CHAIN_ID_TO_LINK_CONTRACT[chainId]
      if (!linkContractAddress) {
        throw new Error(`LINK contract address unspecified and no defautl value is known for chain id ${chainId}`)
      }
    }

    let wallet = null
    if (credentials) {
      wallet = new ethers.Wallet(credentials.ethPrivateKey, provider)
    } else {
      throw new Error('Cannot deploy contract without knowing account credentials')
    }

    const factory = new ethers.ContractFactory(csgoTradeContract.abi, csgoTradeContract.bytecode, wallet)
    const contract = await factory.deploy(linkContractAddress)
    log.info(`Triggered deployment of contract with address ${contract.address} as part of transaction ${contract.deployTransaction.hash}`)
    log.info(`Waiting for tx to be mined..`)

    await contract.deployed()
    log.info(`Contract deployed successfully.`)

    log.info(`Generating listing manager..`)
    const listingManager = new ListingManager(rpc, contract.address, credentials)

    await listingManager.setup(false)
    return listingManager
  }
}

module.exports = ListingManager
