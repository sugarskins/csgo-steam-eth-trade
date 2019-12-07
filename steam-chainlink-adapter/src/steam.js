const fetch = require('node-fetch')
const SteamID = require('steamid')
const url = require('url')
const querystring = require('querystring')
const log = require('./log')
const {
  InvalidTradeURLError,
  ProfileIsPrivateError,
  SystemInitNotFinishedError,
  InternalError
} = require('./errors')

const {
  validateTradeURLPageContent,
  getWebEligibilityCookie,
  isSameWear,
  inspectLinkToSMAD
} = require('./utils')

const steamUser = require('./steamUser')
const getSteamScanner = steamUser.getSteamScanner
const getSteamWebSession = steamUser.getSteamWebSession


const CONTAINS_ITEM_FALSE = 0
const CONTAINS_ITEM_TRUE = 1
const CONTAINS_ITEM_INVENTORY_PRIVATE = 2
const CONTAINS_ITEM_TRADE_URL_INVALID = 3
const CONTAINS_ITEM_INSPECT_LINK_INVALID = 4

async function inventoryContainsItemWithInspectLink(tradeURL, inspectLink, wear, skinName, paintSeed) {
  log.info(`Looking up steamId for trade URL ${tradeURL}..`)
  try {
    validateTradeURL(tradeURL)
    await validateTradeURLPage(tradeURL)
  } catch (e) {
    if (e instanceof InvalidTradeURLError) {
      log.error(`Trade URL ${tradeURL}  is no longer valid. Cannot identify steam id and therefore cannot process request.`)
      return {
        containsItem: CONTAINS_ITEM_TRADE_URL_INVALID,
        steamID64: null
      }
    } else if (e instanceof ProfileIsPrivateError) {
      log.error(`Trade URL ${tradeURL}  owner's inventory is set to private. Cannot identify steam id and therefore cannot process request.`)
      return {
        containsItem: CONTAINS_ITEM_INVENTORY_PRIVATE,
        steamID64: null
      }
    } else {
      log.error(`Failed to fetch trade link page for ${tradeURL}`)
      throw e
    }
  }

  const parsedTradeURL = url.parse(tradeURL)
  const query = querystring.parse(parsedTradeURL.query)
  const individualAccountID = query['partner']
  const steamId = SteamID.fromIndividualAccountID(individualAccountID)
  let steamID64 = steamId.getSteamID64()

  if (!steamID64) {
    throw InternalError(`Failed to fetch steam id from Trade URL ${tradeURL} for unknown reasons.`)
  }

  const smad = inspectLinkToSMAD(inspectLink)

  if (steamID64 !== smad.s) {
    return {
      containsItem: CONTAINS_ITEM_FALSE,
      steamID64
    }
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
    steamID64
  }
}

function validateTradeURL(tradeURL) {
  const { host, hostname, protocol, pathname, query } = url.parse(tradeURL)
  const parsedQuerystring = querystring.parse(query)
  if (protocol !== 'https:' || host !== 'steamcommunity.com' || hostname !== 'steamcommunity.com' ||
      pathname !== '/tradeoffer/new/' || !parsedQuerystring['partner'] || !parsedQuerystring['token']) {
    throw InvalidTradeURLError(`The trade url ${tradeURL} is not a valid steamcommunity.com trade URL.`)
  }
}

async function validateTradeURLPage(tradeURL) {
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
  validateTradeURLPageContent(tradeURLPageText)
}

function isReady() {
  return Boolean(getSteamScanner())
}

module.exports = {
  inventoryContainsItemWithInspectLink,
  isReady
}
