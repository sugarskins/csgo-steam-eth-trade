const CEconItem = require('steamcommunity/classes/CEconItem')
const fetch = require('node-fetch')
const { InventoryQueryRateLimitError } = require('./errors')
const { getInventoryUrl, getCsgoInventoryUrl } = require('./utils')


const CSGO_CONTEXT_ID = 2
const INVENTORY_MAX_SIZE = 1000 // for inventory only, this works

const STEAM_PROFILE_IS_PRIVATE_MESSAGE = 'This profile is private.'

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

  const fetchResponse = await fetch(url, options)
  const rawItemsResponse = await fetchResponse.json()

  if (rawItemsResponse === null) {
    throw new InventoryQueryRateLimitError(`Rate limit error reached.`)
  } else if (rawItemsResponse.success === false && rawItemsResponse.Error === STEAM_PROFILE_IS_PRIVATE_MESSAGE) {
    throw new ProfileIsPrivateError(STEAM_PROFILE_IS_PRIVATE_MESSAGE)
  } else if (rawItemsResponse.success === false) {
    throw new Error(`Unknown error: ${rawItemsResponse.Error}`)
  }

  const inventory = parseInventoryItems(rawItemsResponse, steamId)

  return inventory
}

function parseInventoryItems(items, steamId) {
  const inventory = []
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

module.exports = {
  getInventory
}
