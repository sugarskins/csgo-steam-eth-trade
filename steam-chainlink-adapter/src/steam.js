const CEconItem = require('steamcommunity/classes/CEconItem')
const fetch = require('node-fetch')
const log = require('./log')

const getSteamScanner = require('./steamUser').getSteamScanner


const CSGO_CONTEXT_ID = 2
const INVENTORY_MAX_SIZE = 1000 // for inventory only, this works

async function inventoryContainsItem(accountName, steamId, wear, skinName, paintSeed) {

  const inventoryItems = await getInventory(accountName, steamId)

  const scanner = getSteamScanner()

  const item = await findItemByWear(scanner, inventoryItems, skinName, paintSeed, wear)

  return item !== null
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

    if (scannedCandidate.paintseed.toString() === paintSeed, isSameWear(scannedCandidate.paintwear.toString(), wear)) {
      return scannedCandidate
    }
  }

  // could not find any matches, return null.
  return null
}


async function getInventory(accountName, steamId) {
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
      'Cookie': '', //cookies.join('; '),
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

  Object.keys(items.rgInventory).forEach(a => {
    const item = new CEconItem(
      items.rgInventory[a],
      items.rgDescriptions,
      CSGO_CONTEXT_ID
    );

    if (item.actions) {
      inventory.push({
        ...item,
        owner: accountName,
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
  isReady
}
