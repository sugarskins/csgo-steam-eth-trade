# Steam Chainlink Adapter

## How to use

* Install dependencies `npm install`
* Setup a [Steam account]() with 2-factor authentication and secret, owning [Counter Strike: Global Offensive](https://store.steampowered.com/app/730/CounterStrike_Global_Offensive/)
* Set up [Environment variables](#)


## Run with docker

TODO


## Steam account

In order to access public trade URLs and to scan CS:GO weapons, the provisioned steam account needs to have 2-factor authentication enabled. 

## Environment variables



## Steam API Troubleshooting tips
### Steam rate limits notes

#### Inventory contents read

`https://steamcommunity.com/profiles/{steamId}/inventory/json/730/2?count=1000`

For accessing the inventory page there's a minimum 8s cooldown if the request is made from an authenticated account.


For an unauthenticated request the API is much more sensitive to requests (a 20s cooldown is not sufficient)

