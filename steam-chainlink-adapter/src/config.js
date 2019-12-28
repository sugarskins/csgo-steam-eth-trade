
const config = {
  steam: {
    accountName: process.env.STEAM_ACCOUNT_NAME,
    password: process.env.STEAM_ACCOUNT_PASSWORD,
    secretToken: process.env.STEAM_ACCOUNT_SECRET_TOKEN,
  },
  port: process.env.EA_PORT
}

module.exports = {
  getSteamConfig: () => JSON.parse(JSON.stringify(config.steam)),
  getPort: () => config.port
}
