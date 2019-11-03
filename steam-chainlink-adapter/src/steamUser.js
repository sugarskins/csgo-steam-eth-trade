global._mckay_statistics_opt_out = true
const SteamUser = require('steam-user')
const SteamTotp = require('steam-totp')
const log = require('./log')

const LOG_ON_TIMEOUT = 20000

let steamUserTuple = null

async function initUser(credentials) {
  const steamUser = new SteamUser()

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

  userTuple = {
    steamUser: steamUser,
    webSession: { sessionID, cookies }
  }

  steamUser.gracefullyDisconnectAsync = () =>
    new Promise(resolve => {
      steamUser
        .once('disconnected', () => {
          log.info(`${credentials.accountName} successfully disconnected.`)

          resolve()
        })
        .logOff()
    })

  return userTuple
}

;(async () => {
  try {
    steamUserTuple = await initUser()
  } catch(e) {
    log.error(`FATAL: failed to initialize steam user: ${e.stack}`)
    process.exit(1)
  }
})()

module.exports = {
  getSteamUserTuple: () => steamUserTuple
}
