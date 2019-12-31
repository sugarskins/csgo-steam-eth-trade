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

Once that is done you need to obtain the 2-factor secret token for that account in order to be able to login to the account at adapter boot-time automatically. One way to do that is to setup the steam account to use the  [SteamDesktopAuthenticator](https://github.com/Jessecar96/SteamDesktopAuthenticator) and extract the two-factor authentication secret token from the credentials file (`maFiles`) created by the SteamDesktopAuthenticator.



## Environment variables



## Steam API Troubleshooting tips
### Steam rate limits notes

#### Inventory contents read

`https://steamcommunity.com/profiles/{steamId}/inventory/json/730/2?count=1000`

For accessing the inventory page there's a minimum 8s cooldown if the request is made from an authenticated account.


For an unauthenticated request the API is much more sensitive to requests (a 20s cooldown is not sufficient)

