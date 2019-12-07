global._mckay_statistics_opt_out = true
const SteamUser = require('steam-user')
const SteamTotp = require('steam-totp')
const GlobalOffensive = require('globaloffensive')
const TradeOfferManager = require('steam-tradeoffer-manager')
const Scanner = require('./scanner')
const log = require('./log')

const LOG_ON_TIMEOUT = 20000
const CSGO_APP_ID = 730

let steamScanner = null
let steamWebSession = null
class SteamUserClients {
  constructor(steamUser, webSession, csgo) {
    this.steamUser = steamUser
    this.webSession = webSession
    this.csgo = csgo
  }
}

async function getSteamUserClients(logOnDetails) {
  let credentials = {
    accountName: logOnDetails.accountName,
    password: logOnDetails.password,
    twoFactorCode: SteamTotp.generateAuthCode(logOnDetails.secretToken),
    logonID: getRandomLogonId()
  };

  const steamUser = new SteamUser()

  const tradeOfferManager = new TradeOfferManager({
    "steam": steamUser,
    "domain": "example.com",
    "language": "en"
  })

  const csgo = new GlobalOffensive(steamUser)

  log.info(
    `Logging in ${credentials.accountName} with logonID ${credentials.logonID}`
  );

  steamUser.logOn(credentials)

  steamUser.on('error', e => {
    log.error(`FATAL: Steam client failed with error ${e.stack}`)
    // TODO: handle this somehow with an exception flow.
    process.exit(1)
  })

  await Promise.race([
    new Promise(resolve => steamUser.on('loggedOn', resolve)),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`logging on timeout!`)), LOG_ON_TIMEOUT)
    )
  ])

  log.info(
    `Logged into Steam as ${
      logOnDetails.accountName
      } (${steamUser.steamID.getSteamID64()})`
  );
  log.info(`Waiting for web session for ${credentials.accountName}...`)

  let { sessionID, cookies } = await Promise.race([
    new Promise(resolve =>
      steamUser.on('webSession', (sessionID, cookies) =>
        resolve({ sessionID, cookies })
      )
    ),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`web session reading timeout!`)), 20000)
    )
  ])

  log.info(`Setting cookies for TradeOfferManager..`)
  await new Promise((resolve, reject) => {
    tradeOfferManager.setCookies(cookies, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })

  steamUser.gamesPlayed([CSGO_APP_ID])

  log.info('Waiting for CSGO to launch..')
  await new Promise((resolve, reject) => {
    csgo.on('connectedToGC', () => {
      resolve()
    })
  })
  log.info('CSGO launched successfully')

  steamUser.gracefullyDisconnectAsync = () =>
    new Promise(resolve => {
      steamUser
        .once('disconnected', () => {
          log.info(`${credentials.accountName} successfully disconnected.`)

          resolve()
        })
        .logOff()
    })

  const steamUserClients = new SteamUserClients(steamUser, { sessionID, cookies }, csgo, tradeOfferManager)
  return steamUserClients
}

function getRandomLogonId() {
  return Math.round(Math.random() * Math.pow(2, 30));
}

log.runWithContinuationId('steam-clients-init', async () => {
  try {
    const logOnDetails = {
      accountName: process.env.STEAM_ACCOUNT_NAME,
      password: process.env.STEAM_ACCOUNT_PASSWORD,
      secretToken: process.env.STEAM_ACCOUNT_SECRET_TOKEN,
    }
    steamClients = await getSteamUserClients(logOnDetails)
    steamWebSession = steamClients.webSession
    steamScanner = new Scanner(steamClients.csgo)
    log.info(`User ${logOnDetails.accountName} logged on successfully.`)
  } catch(e) {
    log.error(`FATAL: failed to initialize steam user: ${e.stack}`)
    process.exit(1)
  }
})


module.exports = {
  getSteamScanner: () => steamScanner,
  getSteamWebSession: () => steamWebSession
}
