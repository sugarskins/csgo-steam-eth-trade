# csgo-steam-eth-trade

Tools to support the secure trading of CS:GO Steam community market items for Ethereum.

Contains:

* csgo-steam-eth-contract - the Solidity contract supports the ability to purchase CS:GO items with the wear and paintseed properties using ETH.
* steamcommunity-chainlink-adapter - Chainlink adapter for access to data o the Steam Community market.


## Local development setup


### Running a chainlink node

You can follow the following guide to setup a local chainlink node.
https://docs.chain.link/docs/running-a-chainlink-node


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
#### Connecting to a local postgresql running on the host machine

If you attempt to connect to a localhost database such as `DATABASE_URL=postgresql://dan:@localhost:5432/chainlink`  you will get the following error:

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







