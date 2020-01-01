# csgo-steam-eth-trade

Perform secure trading of CS:GO Steam community market items without a trusted third-party middleman. Check the website for a high-level overview and FAQ http://sugarskins.com/#/help

In a nutshell, SugarSkins allows you to:

* post item listings to a smart trade contract deployed on Ethereum as a seller
* potential buyers can post purchase offers for those item listings accompanied by a a payment in ETH
* the seller has the responsibility to send the item to the buyer, and request the contract to validate using a chainlink oracle that the item is now in the buyer's inventory. Then and only then are the funds dispatched to the seller
* If not delivered and confirmed within the defined time limit, the buyer can request a refund and be refunded automatically by the smart contract


This eliminates the need for a third party holding items in its inventory, and money deposits either fiat or crypto, thus reducing fees and unreliability that comes with third party middle-men.

Contains:

* csgo-steam-eth-contract - the Solidity contract supports the ability to purchase CS:GO items with the wear and paintseed properties using ETH.
* steamcommunity-chainlink-adapter - Chainlink adapter for access to data o the Steam Community market.
* csgo-trade-frontend - Frontend for interacting with the previously defined Solidity contract for viewing sale listings and for submitting purchase offers.
* csgo-trade-vendor-backend - a CLI backend for deploying a trade contracts, posting and deleting listings, requesting item delivery confirmations


The use case was referenced in the [Chainlink 2017 paper](https://link.smartcontract.com/whitepaper). This implementation covers the use case specifically for CS:GO weapons (with skin name, wear and paint-seed properties) and does not require credential authentication on the side of the seller and buyer, because the checks are performed by validating that the properties of the delivered item uniquely match the properties in the initial listing, by inspecting the public inventory of the buyer post-delivery.  

## Local development setup

This assumes you have `npm` installed, and you have a browser with the [MetaMask](https://metamask.io/) extension (known to work well with Chrome, for [Brave](https://brave.com/) browser make sure you disable the built-in MetaMask  wallet, otherwise the 2 will clash at runtime).

To run the project locally with a setup that has everything except for the chainlink node and confirmations and uses ganache, install all dependencies:

```
 git clone https://github.com/sugarskins/csgo-steam-eth-trade.git
 cd csgo-steam-eth-trade
 cd csgo-trade-frontend
 npm i
 cd ../csgo-trade-vendor-backend
 npm i
 cd ../csgo-trade-contract
 npm i
```

You need ganache, you can obtain it with:
```
npm i -g ganache-cli
```

And run it with 
```
 ganache-cli --defaultBalanceEther 100000000000000000 --account="<private address of choice that defaults to be the owner of the trade contract >,10000000000000000000000000000"
--account="<your metamask address to make sure you can use it during testing >,10000000000000000000000000000"
```

```
# Assuming you are still in csgo-trade-contract do:
truffle migrate --network cldev
```
This should output your contract addresses for the CS:GO trade contract and the oracle contract. Make a note of them at this point.

```
cd ../csgo-trade-frontend
npm start
# navigate to to localhost:3000/#/?contractAddress=<the address which came out of the truffle migrate for the trade contract>
# or simply paste that address in the contract address form and press enter
```

Assuming you have metamask enabled, and you have valid trade URL to paste in the trade URL field, you can execute a purchase request and allow access to metamask.

### Adding items as vendor to trade contract

To post listings go to `csgo-trade-vendor-backend/README.md` or run `node cli.js --help` to see what is needed.

### Running a chainlink node

For use on ropsten and main-net follow these instructions to deploy a chainlink node.

You can follow the following guide to setup a local chainlink node.
https://docs.chain.link/docs/running-a-chainlink-node

Sample `.env` file for ropsten:

```
ROOT=/chainlink
LOG_LEVEL=debug
ETH_CHAIN_ID=3
MIN_OUTGOING_CONFIRMATIONS=2
LINK_CONTRACT_ADDRESS=0x20fe562d797a42dcb3399062ae9546cd06f63280
CHAINLINK_TLS_PORT=0
SECURE_COOKIES=false
ALLOW_ORIGINS=*
ETH_URL=wss://ropsten.infura.io/ws
DATABASE_URL=postgresql://username:password@host:5432/database
DATABASE_TIMEOUT=0
```

#### Docker tips

Run this command to connect to a remote database.
```
docker run --net=host  -p 6688:6688 -v ~/.chainlink-ropsten:/chainlink -it --env-file=.env smartcontract/chainlink local n
```

Running the chainlink node over and over creates a new image each time since they are immutable.

To clean them all up with 1 command execute:

```
docker ps -a | awk '{ print $1,$2 }' | grep chainlink | awk '{print $1 }' | xargs -I {} docker rm {}
```

### Troubleshooting
#### Connecting to a local postgresql running on the host machine

If you attempt to connect to a localhost database from your chainlink node such as `DATABASE_URL=postgresql://dan:@localhost:5432/chainlink`  you will get the following error:

```
[FATAL] Unable to initialize ORM: unable to lock ORM: the following errors occurred:
 -  postgres advisory locking strategy failed, timeout set to indefinite
 -  dial tcp 127.0.0.1:5432: connect: connection refused
```

Since the localhost IP is resolved within the context of the docker container.

A solution is needed here to allow connecting to a database living on the host machine.

##### Solution for OS X

Go edit your postgres config files most likely found at: `/usr/local/var/postgres/` depending what version you're running it could also be something like `/usr/local/var/postgresql@10/`

Edit `postgresql.conf` to have `listen_addresses = '*'`

Edit `pg_hba.conf` to add the line `host  all  all 0.0.0.0/0 md5` at the end.

Restart the service for changes to kick in:
```
brew services restart postgresql
```

Run this to get your local machine address:

```
ipconfig getifaddr en0
```

edit the `~/.chainlink-ropsten/.env` to use the IP you got in the `DATABASE_URL`

You also need the postgres machine to have SSL enabled.




### Contributor acknowledgements

Acknolwedging contributions that are not reflected by the commit history ownership.

* [Catalin Amza](https://github.com/CatalinAmza)
	* Reverse engineed  the steam API for read/write operations, rate limits, item properties (wear, paintseed)
	* Evaluated the value of the project and weighed on its design with his deep knowledge of the Steam community market dynamics and trading ecosystem
	* Did a security review of the project to identify potential exploits from the Steam API perspective
	* Authored the first version of the inspect link scanner https://github.com/danoctavian/csgo-steam-eth-trade/blob/master/steam-chainlink-adapter/src/scanner.js
	* Authored the first version of the steam user code https://github.com/danoctavian/csgo-steam-eth-trade/blob/master/steam-chainlink-adapter/src/steamUser.js
	* Advised on the UX/UI design of the frontend (content and style)






