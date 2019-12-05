const log = require('./src/log')
const config = require('./config.json')

;(async () => {
  try {
    process.env.STEAM_ACCOUNT_NAME = config.steamAccount.name
    process.env.STEAM_ACCOUNT_PASSWORD =  config.steamAccount.password
    process.env.STEAM_ACCOUNT_SECRET_TOKEN = config.steamAccount.secretToken
    process.env.HTTPS_PROXIES = config.httpsProxies
    const app = require('./app')
  } catch (e) {
    log.error(`FATAL: ${e.stack}`)
    process.exit(1)
  }
})()
