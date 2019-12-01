const CEconItem = require('steamcommunity/classes/CEconItem')
const fetch = require('node-fetch')
const log = require('./log')
const { extractSteamIdFromTradeLinkPage, getWebEligibilityCookie } = require('./utils')
const { InvalidTradeLinkError, ProfileIsPrivateError } = require('./errors')

const steamUser = require('./steamUser')
const getSteamScanner = steamUser.getSteamScanner
const getSteamWebSession = steamUser.getSteamWebSession


const CSGO_CONTEXT_ID = 2
const INVENTORY_MAX_SIZE = 1000 // for inventory only, this works

const STEAM_PROFILE_IS_PRIVATE_MESSAGE = 'This profile is private.'

const CONTAINS_ITEM_FALSE = 0
const CONTAINS_ITEM_TRUE = 1
const CONTAINS_ITEM_INVENTORY_PRIVATE = 2
const CONTAINS_ITEM_TRADE_URL_INVALID = 3

async function inventoryContainsItem(tradeLink, wear, skinName, paintSeed) {

  log.info(`Looking up steamId for trade link ${tradeLink}..`)

  let steamId = null
  try {
    steamId = await getTradeLinkOwnerSteamId(tradeLink)
  } catch (e) {
    if (e instanceof InvalidTradeLinkError) {
      log.error(`Trade link ${tradeLink}  is no longer valid. Cannot identify steam id and therefore cannot process request.`)
      return {
        containsItem: CONTAINS_ITEM_TRADE_URL_INVALID,
        steamId: null
      }
    } else {
      throw e
    }
  }


  log.info(`steamId detected to be ${steamId}.`)

  let inventoryItems = null
  try {
    inventoryItems = await getInventory(steamId)
  } catch (e) {
    if (e instanceof ProfileIsPrivateError) {
      log.error(`Received message ${ProfileIsPrivateError} from Steam. Classifying profile as private.`)
      return {
        containsItem: CONTAINS_ITEM_INVENTORY_PRIVATE,
        steamId: null
      }
    } else {
      throw e
    }
  }

  const scanner = getSteamScanner()

  const item = await findItemByWear(scanner, inventoryItems, skinName, paintSeed, wear)

  const itemFound = item !== null
  const containsItem = itemFound ? CONTAINS_ITEM_TRUE : CONTAINS_ITEM_FALSE
  return {
    containsItem: containsItem,
    steamId
  }
}

async function findItemByWear(scanner, inventoryItems, skinName, paintSeed, wear) {
  const candidates = inventoryItems.filter(item => item.market_hash_name === skinName)

  log.info(`There are ${candidates.length} potential matches in the inventory \
    for the skin ${skinName} with wear ${wear}`)

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    const inspectLink = candidate.inspectLink
    log.info(`Scanning possible match ${candidate.market_hash_name} with inspect link ${candidate.inspectLink}`)
    const scannedCandidate = await scanner.scanInspectLink(inspectLink)

    console.log(scannedCandidate)

    if (scannedCandidate.paintseed.toString() === paintSeed && isSameWear(scannedCandidate.paintwear.toString(), wear)) {
      return scannedCandidate
    }
  }

  // could not find any matches, return null.
  return null
}


async function getTradeLinkOwnerSteamId(tradeLink) {
  const { cookies } = getSteamWebSession()

  const webTradeEligibilityCookie = getWebEligibilityCookie()
  cookies.push(webTradeEligibilityCookie)
  let cookie = cookies.join('; ')
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

  const fetchResponse = await fetch(tradeLink, options)
  const tradeLinkPageText = await fetchResponse.text()
  const steamId = extractSteamIdFromTradeLinkPage(tradeLinkPageText)
  return steamId
}

async function getInventory(steamId) {
  const referer = getInventoryUrl(steamId)
  const url = getCsgoInventoryUrl(steamId, INVENTORY_MAX_SIZE)
  const options = {
    credentials: 'include',
    headers: {
      'accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'accept-language': 'en-US,en;q=0.9,en-GB;q=0.8',
      'cache-control': 'no-cache',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'pragma': 'no-cache',
      'Cookie': '',
      'Host': 'steamcommunity.com',
      'Origin': 'https://steamcommunity.com',
      'Content-Length': '81',
      'Connection': 'keep-alive',
      'Referer': referer,
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36'
    },
    referrer: referer,
    referrerPolicy: 'no-referrer-when-downgrade',
    method: 'GET'
  };
  const inventory = []

  const fetchResponse = await fetch(url, options)
  const items = await fetchResponse.json()

  if (items === null) {
    throw new Error(`Rate limit error reached.`)
  } else if (items.success === false && items.Error === STEAM_PROFILE_IS_PRIVATE_MESSAGE) {
    throw new ProfileIsPrivateError(STEAM_PROFILE_IS_PRIVATE_MESSAGE)
  } else if (items.success === false) {
    throw new Error(`Unknown error: ${items.Error}`)
  }

  Object.keys(items.rgInventory).forEach(a => {
    const item = new CEconItem(
      items.rgInventory[a],
      items.rgDescriptions,
      CSGO_CONTEXT_ID
    );

    if (item.actions) {
      inventory.push({
        ...item,
        inspectLink: item.actions[0].link
          .replace('%owner_steamid%', steamId)
          .replace('%assetid%', a)
      })
    }
  })

  return inventory
}

function getInventoryUrl(steamId) {
  return `https://steamcommunity.com/profiles/${steamId}/inventory`
}

function getCsgoInventoryUrl(steamId, pageSize = 100) {
  return `${getInventoryUrl(steamId)}/json/730/2?count=${pageSize}`
}


function isSameWear(wear1, wear2) {
  const DIGITS = 14
  return wear1.slice(0, DIGITS) === wear2.slice(0, DIGITS)
}

function isReady() {
  return Boolean(getSteamScanner())
}

module.exports = {
  inventoryContainsItem,
  getTradeLinkOwnerSteamId,
  isReady
}
