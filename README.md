# csgo-steam-eth-trade

Perform secure trading of CS:GO Steam community market items without a trusted third-party middleman. Check the website for a high-level overview and FAQ http://sugarskins.com/#/help

Contains:

* csgo-steam-eth-contract - the Solidity contract supports the ability to purchase CS:GO items with the wear and paintseed properties using ETH.
* steamcommunity-chainlink-adapter - Chainlink adapter for access to data o the Steam Community market.
* csgo-trade-frontend - Frontend for interacting with the previously defined Solidity contract for viewing sale listings and for submitting purchase offers.
* csgo-trade-vendor-backend - a CLI backend for deploying a trade contracts, posting and deleting listings, requesting item delivery confirmations


## Local development setup


### Running a chainlink node

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






