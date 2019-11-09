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
#### Pitfalls

If you attempt to connect to a localhost database such as `DATABASE_URL=postgresql://dan:@localhost:5432/chainlink`  you will get the following error:

```
[FATAL] Unable to initialize ORM: unable to lock ORM: the following errors occurred:
 -  postgres advisory locking strategy failed, timeout set to indefinite
 -  dial tcp 127.0.0.1:5432: connect: connection refused
```

Since the localhost IP is resolved within the context of the docker container.

A solution is needed here to allow connecting to a database living on the host machine.

