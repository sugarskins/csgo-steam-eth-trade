const fetch = require('node-fetch')
const log = require('./log')
const {
  InvalidTradeURLError,
  ProfileIsPrivateError,
  SystemInitNotFinishedError,
  InternalError
} = require('./errors')

const {
  extractSteamIdFromTradeURLPage,
  getWebEligibilityCookie,
  isSameWear
} = require('./utils')

const steamUser = require('./steamUser')
const getSteamScanner = steamUser.getSteamScanner
const getSteamWebSession = steamUser.getSteamWebSession


const CONTAINS_ITEM_FALSE = 0
const CONTAINS_ITEM_TRUE = 1
const CONTAINS_ITEM_INVENTORY_PRIVATE = 2
const CONTAINS_ITEM_TRADE_URL_INVALID = 3

async function inventoryContainsItemWithInspectLink(tradeURL, inspectLink, wear, skinName, paintSeed) {
  log.info(`Looking up steamId for trade URL ${tradeURL}..`)

  let steamId = null
  try {
    steamId = await getTradeURLOwnerSteamId(tradeURL)
  } catch (e) {
    if (e instanceof InvalidTradeURLError) {
      log.error(`Trade link ${tradeURL}  is no longer valid. Cannot identify steam id and therefore cannot process request.`)
      return {
        containsItem: CONTAINS_ITEM_TRADE_URL_INVALID,
        steamId: null
      }
    } else if (e instanceof ProfileIsPrivateError) {
      log.error(`Trade link ${tradeURL}  owner's inventory is set to private. Cannot identify steam id and therefore cannot process request.`)
      return {
        containsItem: CONTAINS_ITEM_INVENTORY_PRIVATE,
        steamId: null
      }
    } else {
      log.error(`Failed to fetch trade link page for ${tradeURL}`)
      throw e
    }
  }

  if (!steamId) {
    throw InternalError(`Failed to fetch steam id from Trade URL ${tradeURL} for unknown reasons.`)
  }

  const scanner = getSteamScanner()
  if (!scanner){
    throw new SystemInitNotFinishedError('SteamScanner not initialized yet.')
  }

  log.info(`Scanning item at provided inspectLink to see the match..`)
  const scannedCandidate = await scanner.scanInspectLink(inspectLink)

  const itemFound = scannedCandidate.paintseed.toString() === paintSeed && isSameWear(scannedCandidate.paintwear.toString(), wear)

  const containsItem = itemFound ? CONTAINS_ITEM_TRUE : CONTAINS_ITEM_FALSE
  return {
    containsItem: containsItem,
    steamId
  }
}

async function getTradeURLOwnerSteamId(tradeURL) {
  const webSession = getSteamWebSession()
  if (!webSession) {
    throw new SystemInitNotFinishedError('Steam webSession not initialized yet.')
  }
  const { cookies } = webSession

  const webTradeEligibilityCookie = getWebEligibilityCookie()

  const cookiesCloned = JSON.parse(JSON.stringify(cookies))
  cookiesCloned.push(webTradeEligibilityCookie)
  let cookie = cookiesCloned.join('; ')
  const options = {
    headers: {
      'accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'accept-language': 'en-US,en;q=0.9,en-GB;q=0.8',
      'cache-control': 'no-cache',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'pragma': 'no-cache',
      'Cookie': cookie,
      'Host': 'steamcommunity.com',
      'Origin': 'https://steamcommunity.com',
      'Content-Length': '11147',
      'Connection': 'keep-alive',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36'
    },
    method: 'GET'
  }

  const fetchResponse = await fetch(tradeURL, options)
  const tradeURLPageText = await fetchResponse.text()
  const steamId = extractSteamIdFromTradeURLPage(tradeURLPageText)
  return steamId
}

function isReady() {
  return Boolean(getSteamScanner())
}

module.exports = {
  inventoryContainsItemWithInspectLink,
  isReady
}
