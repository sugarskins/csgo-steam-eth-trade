const CEconItem = require('steamcommunity/classes/CEconItem')

  const getSteamUserTuple = require('./steamUser').getSteamUserTuple

const CSGO_APP_ID = 730
const CSGO_CONTEXT_ID = 2
const INVENTORY_MAX_SIZE = 1000 // for inventory only, this works


async function inventoryContainsItem(accountName, wear, skinName, paintSeed) {
  /*
  TODO: call getInventory filter for items matching the avaialable props and scan the items that have matching wear
  */
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

    inventory.push({
      ...item,
      owner: accountName,
      inspectLink: item.actions[0].link
        .replace('%owner_steamid%', steamId)
        .replace('%assetid%', a)
    })
  })

  return inventory
}

function getInventoryUrl(steamId) {
  return `https://steamcommunity.com/profiles/${steamId}/inventory`
}

function getCsgoInventoryUrl(steamId, pageSize = 100) {
  return `${getInventoryUrl(steamId)}/json/730/2?count=${pageSize}`
}

module.exports = {
  inventoryContainsItem
}
