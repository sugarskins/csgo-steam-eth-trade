
const config = {
  steam: {
    accountName: process.env.STEAM_ACCOUNT_NAME,
    password: process.env.STEAM_ACCOUNT_PASSWORD,
    secretToken: process.env.STEAM_ACCOUNT_SECRET_TOKEN,
  }
}

module.exports = {
  getSteamConfig: () => config.steam
}
