import querystring from 'querystring'

export function validateTradeURL(tradeURL) {

    if (!tradeURL  || tradeURL.trim().length === 0) {
        return {
            valid: false,
            error: 'Trade URL is empty.'
        }
    }
    const { host, hostname, protocol, pathname, search } = new URL(tradeURL)
    // without the question mark
    const parsedQuerystring = querystring.parse(search.slice(1))
    if (protocol !== 'https:' || host !== 'steamcommunity.com' || hostname !== 'steamcommunity.com' ||
        pathname !== '/tradeoffer/new/' || !parsedQuerystring['partner'] || !parsedQuerystring['token']) {
      return {
        valid: false,
        error: `The trade url ${tradeURL} is not a valid steamcommunity.com trade URL.`
      }
    }
    return {
        valid: true
    }
}

