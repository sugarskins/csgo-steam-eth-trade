const Web3 = require('web3')

const web3RPCHost = process.env.WEB3_RPC_HOST
const web3 = new Web3(web3RPCHost)


class PurchaseOfferHandler {
  constructor(web3RPCHost, contractAddress, steamAccess, s) {
  }

  async run() {

  }
}


// async function findTradeLinkOwnerItem(tradeLink, wear, skinName, paintSeed) {
//
//   log.info(`Looking up steamId for trade link ${tradeLink}..`)
//
//   let steamId = null
//   try {
//     steamId = await getTradeLinkOwnerSteamId(tradeLink)
//   } catch (e) {
//     if (e instanceof InvalidTradeLinkError) {
//       log.error(`Trade link ${tradeLink}  is no longer valid. Cannot identify steam id and therefore cannot process request.`)
//       return {
//         containsItem: CONTAINS_ITEM_TRADE_URL_INVALID,
//         steamId: null
//       }
//     } else {
//       log.error(`Failed to fetch trade link page for ${tradeLink}`)
//       throw e
//     }
//   }
//
//
//   log.info(`steamId detected to be ${steamId}.`)
//
//   let inventoryItems = null
//   try {
//     inventoryItems = await getInventory(steamId)
//   } catch (e) {
//     if (e instanceof ProfileIsPrivateError) {
//       log.error(`Received message ${ProfileIsPrivateError} from Steam. Classifying profile as private.`)
//       return {
//         containsItem: CONTAINS_ITEM_INVENTORY_PRIVATE,
//         steamId: null
//       }
//     } else {
//       log.error(`Failed to fetch inventory page for ${tradeLink} with steamId ${steamId}`)
//       throw e
//     }
//   }
//
//   const scanner = getSteamScanner()
//   if (!scanner){
//     throw new SystemInitNotFinishedError('SteamScanner not initialized yet.')
//   }
//
//   const item = await findItemByWear(scanner, inventoryItems, skinName, paintSeed, wear)
//   return item
// }
//
// async function findItemByWear(scanner, inventoryItems, skinName, paintSeed, wear) {
//   const candidates = inventoryItems.filter(item => item.market_hash_name === skinName)
//
//   log.info(`There are ${candidates.length} potential matches in the inventory \
//     for the skin ${skinName} with wear ${wear}. Scanning each one to find a match..`)
//
//   for (let i = 0; i < candidates.length; i++) {
//     const candidate = candidates[i]
//     const inspectLink = candidate.inspectLink
//     log.info(`Scanning possible match ${candidate.market_hash_name} with inspect link ${candidate.inspectLink}`)
//     const scannedCandidate = await scanner.scanInspectLink(inspectLink)
//
//     if (scannedCandidate.paintseed.toString() === paintSeed && isSameWear(scannedCandidate.paintwear.toString(), wear)) {
//       return scannedCandidate
//     }
//   }
//
//   // could not find any matches, return null.
//   return null
// }
