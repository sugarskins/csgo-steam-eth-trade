const axios = require('axios')
const tunnel = require('tunnel')
const log = require('../src/log')
const url = require('url')
const { BufferedAsyncChan } = require('coroutine-utils')
const utils = require('./utils')

const HTTPS_PROXIES_ENV_VAR = 'HTTPS_PROXIES'
const STEAM_COMMUNITY_PROXY_BASE = 'https://steamcommunity.com:443'

let proxyClients = []

const processingChan =  new BufferedAsyncChan()


const BASE_MIN_WAIT = 15000

async function foreverHandleProxyRequests(proxyClient) {
  let minWait = BASE_MIN_WAIT
  while (true) {
    const proxyRequest = await processingChan.read()

    try {
      const response = proxyClient.get(proxyRequest.requestData.path, proxyRequest.requestData.options)
      minWait = BASE_MIN_WAIT
      proxyRequest.resolver.resolve(response)
    } catch (e) {
      if (e.response && re.response.status === 429) {
        minWait *= 2
      }
      proxyRequest.resolver.reject(e)
    }
    await utils.sleep(minWait)
  }
}

try {
  const httpProxiesConfig = process.env[HTTPS_PROXIES_ENV_VAR]
  if (httpProxiesConfig) {
    const proxyURLs = httpProxiesConfig.split(';')

    proxyClients = proxyURLs.map(proxyURL => {
      const parsedProxyUrl = url.parse(proxyURL)

      if (!parsedProxyUrl.hostname || !parsedProxyUrl.port) {
        return null
      }

      const agent = tunnel.httpsOverHttp({
        proxy: {
          host: parsedProxyUrl.hostname,
          port: parsedProxyUrl.port,
          proxyAuth: parsedProxyUrl.auth,
        }
      })

      const axiosClient = axios.create({
        baseURL: STEAM_COMMUNITY_PROXY_BASE,
        httpsAgent: agent,
        proxy: false
      })

      return axiosClient
    }).filter(agent => agent !== null)

    log.info(`Detected ${proxyClients.length} valid proxies in the env var ${HTTPS_PROXIES_ENV_VAR} ..`)

    for (let i = 0; i < proxyClients.length; i++) {
      log.runWithContinuationId(`proxy-request-handler-${i}`, () => foreverHandleProxyRequests(proxyClients[i]))
    }
  }
} catch (e) {
  log.error(`Failed to load proxy configuration: ${e.stack}`)
}

function isAvailable() {
  return proxyClients.length > 0
}

async function doRequest(requestData) {
  const response = await new Promise((resolve, reject) => {
    const proxyRequest = {
      requestData,
      resolver: {
        resolve,
        reject
      }
    }

    processingChan.write(proxyRequest)
  })
  return response
}

module.exports = {
  isAvailable,
  doRequest
}
