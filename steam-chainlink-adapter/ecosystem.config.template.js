module.exports = {
  apps: [{
    name: "steamAdapter",
    script: "./app.js",
    env: {
      STEAM_ACCOUNT_NAME: "",
      STEAM_ACCOUNT_PASSWORD: "",
      STEAM_ACCOUNT_SECRET_TOKEN: ""
    },
  }]
}
