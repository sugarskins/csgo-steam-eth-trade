const { InvalidTradeLinkError, InvalidWearValueError, ProfileIsPrivateError } = require('./errors')

function extractSteamIdFromTradeLinkPage(pageText) {
  const regex = /https:\/\/steamcommunity.com\/profiles\/(\d+)/g
  const matches = []
  let result = regex.exec(pageText)
  while (result) {
    matches.push(result[1])
    result = regex.exec(pageText)
  }

  const firstMatch = matches[0]

  if (!firstMatch) {
    const invalidTradeURLRegex = /This Trade URL is no longer valid for sending a trade offer/
    let firstResult = invalidTradeURLRegex.exec(pageText)
    if (firstResult) {
      throw new InvalidTradeLinkError('This Trade URL is no longer valid for sending a trade offer.')
    }

    const profilePrivateRegex = /inventory privacy is set to "Private"/

    firstResult = profilePrivateRegex.exec(pageText)
    if (firstResult) {
      throw new ProfileIsPrivateError('Trade URL\'s owner inventory privacy is set to "Private"')
    }
  } else {
    return firstMatch
  }
}

function getWebEligibilityCookie() {
  return "webTradeEligibility=" + encodeURIComponent('{"allowed":1,"allowed_at_time":0,"steamguard_required_days":15,"sales_this_year":0,"max_sales_per_year":-1,"forms_requested":0,"new_device_cooldown_days":7}');
}

function getInventoryUrl(steamId) {
  return `https://steamcommunity.com/profiles/${steamId}/inventory`
}

function getCsgoInventoryUrl(steamId, pageSize = 100) {
  return `${getInventoryUrl(steamId)}/json/730/2?count=${pageSize}`
}

function isValidWearValue(wear) {
  return /^0\.\d+$/.test(wear)
}

function isSameWear(wear1, wear2) {
  if (!isValidWearValue(wear1)) {
    throw new InvalidWearValueError(`Wear ${wear1} is invalid.`)
  }
  if (!isValidWearValue(wear2)) {
    throw new InvalidWearValueError(`Wear ${wear2} is invalid.`)
  }

  const DIGITS = 14
  return wear1.slice(0, DIGITS) === wear2.slice(0, DIGITS)
}

async function sleep(millis) {
  await new Promise((resolve, reject) => {
    setTimeout(resolve, millis)
  })
}

function inspectLinkToSMAD(inspectLink) {
  const inspectLinkRegex = /([sm])([0-9]+)a([0-9]+)d([0-9]+)/i
  let match = inspectLink.toLowerCase().match(inspectLinkRegex)
  return {
    s: match[1] === 's' ? match[2] : null,
    m: match[1] === 'm' ? match[2] : null,
    a: match[3],
    d: match[4]
  }
}


module.exports = {
  extractSteamIdFromTradeLinkPage,
  getWebEligibilityCookie,
  getCsgoInventoryUrl,
  getInventoryUrl,
  isSameWear,
  inspectLinkToSMAD,
  sleep
}
