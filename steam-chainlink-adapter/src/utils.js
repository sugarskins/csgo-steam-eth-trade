
function extractSteamIdFromTradeLinkPage(pageText) {
  const regex = /https:\/\/steamcommunity.com\/profiles\/(\d+)/g
  const matches = []
  let result = regex.exec(pageText)
  let i = 0
  while (result) {
    matches.push(result[1])
    result = regex.exec(pageText)
  }

  return matches[0]
}

function getWebEligibilityCookie() {
  return "webTradeEligibility=" + encodeURIComponent('{"allowed":1,"allowed_at_time":0,"steamguard_required_days":15,"sales_this_year":0,"max_sales_per_year":-1,"forms_requested":0,"new_device_cooldown_days":7}');
}

module.exports = {
  extractSteamIdFromTradeLinkPage,
  getWebEligibilityCookie
}
