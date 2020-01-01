# Steam Chainlink Adapter

## How to use

The Adapter runs by using the steam client protocol implemented by the modules: [`steam-user`](https://github.com/DoctorMcKay/node-steam-user) and [`globaloffensive`](https://github.com/DoctorMcKay/node-globaloffensive) to scan Steam CS:GO weapons  for their properties.

It logs into Steam programatically by having access to both the password and the two-factor authentication secret (to generate authentication codes with the [steam-totp](https://github.com/DoctorMcKay/node-steam-totp) module).

* Install dependencies `npm install`
* Setup a [Steam account]() with 2-factor authentication and secret, owning [Counter Strike: Global Offensive](https://store.steampowered.com/app/730/CounterStrike_Global_Offensive/)
* Set up [Environment variables](#)


## Run with docker

TODO


## Steam account

In order to access public trade URLs and to scan CS:GO weapons, the provisioned steam account needs to have two-factor authentication enabled and needs to *own* the [Counter Strike: Global Offensive](https://store.steampowered.com/app/730/CounterStrike_Global_Offensive/) game.

*Warning*: this involves buying the game and owning a non-virtual phone number that can receive SMS in order to setup two-factor authentication.

Once that is done you need to obtain the 2-factor secret token for that account in order to be able to login to the account at adapter boot-time automatically. One way to do that is to setup the steam account to use the  [SteamDesktopAuthenticator](https://github.com/Jessecar96/SteamDesktopAuthenticator) and extract the two-factor authentication secret token from the credentials file (`maFiles`) created by the SteamDesktopAuthenticator.



## Environment variables

As shown in the [`config.js`](https://github.com/sugarskins/csgo-steam-eth-trade/blob/master/steam-chainlink-adapter/src/config.js) file, the adapter requires the following environment variables:

| Variable      |               | Description | Example |
|---------------|:-------------:|------------- |:---------:|
| `STEAM_ACCOUNT_NAME `     | **Required**  | Your Steam account name | `mynameismrsteam` |
| `STEAM_ACCOUNT_PASSWORD `  | **Required**  | Your Steam account two-factor authentication secret token | `thisismysecretaccountpassword` |
| `STEAM_ACCOUNT_SECRET_TOKEN `  | **Required**  | Your Steam account password | `GhB30aWoHGC67qC4rbSEtpeGcvN=` |
| `EA_PORT `  | *Optional*  | The port to run the server on. Defaults to `8080` | `9000` |
| `EA_HOST` | *Optional* | The host to run the server on. Defaults to `0.0.0.0` | `localhost` |

## Available methods

Method can be specified by the `method` key in the request body.

### tradeurlownerhasinspectlinktarget

| Variable | Type |   | Description |
|----------|------|---|-------------|
| `tradeURL` | String | **Required** | Steam trade URL of potential owner (example: `https://steamcommunity.com/tradeoffer/new/?partner=987654321&token=ABcDeFgH` |
| `inspectLink` | String | **Required** | Inspect link of the item checked for ownership (example: `steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198862566094A17372503775D7836475188778060447` |
| `wear` | String | **Required** | Wear of the the item being checked (example: `0.1419128179550171`) |
| `paintSeed` | String | **Required** | Paint seed of the item being checked. (example: `334`) |
| `skinName` | String | **Required** | Skin name of the item being checked. (example: `AUG | Storm (Battle-Scarred)`) |

## Disclaimer 

Disclaimer
In order to use this adapter, you will need to create an account with and obtain credentials from Steam and agree to and comply with Valve’s applicable terms, conditions and policies. In no event will the creators of SugarSkins be liable for your or your user’s failure to comply with any or all of Valve's terms, conditions or policies or any other applicable license terms.


## Steam API Troubleshooting tips
### Steam rate limits notes

#### Inventory contents read

`https://steamcommunity.com/profiles/{steamId}/inventory/json/730/2?count=1000`

For accessing the inventory page there's a minimum 8s cooldown if the request is made from an authenticated account.


For an unauthenticated request the API is much more sensitive to requests (a 20s cooldown is not sufficient)


