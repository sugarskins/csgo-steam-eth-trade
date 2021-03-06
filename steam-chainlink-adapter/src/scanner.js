const log = require('./log')
const { inspectLinkToSMAD } = require('./utils')

const STEAM_REQUEST_TIMEOUT = 500
const STEAM_RESPONSE_TIMEOUT = 1000


class SteamScanner {
  constructor(csgo) {
    this.queue = []
    this.csgo = csgo
  }

  scanInspectLink(inspectLink, resultBuilder) {
    return this.scanSMAD(inspectLinkToSMAD(inspectLink), resultBuilder)
  }

  async runScanner() {
    this.isScannerRunning = true

    let backoffFactor = 1

    while (this.isScannerRunning) {
      if (this.queue.length) {
        let request = this.queue[0]
        log.info(`SteamClient processing ${request.assetid}. Left in queue: ${this.queue.length}`);

        let resolveWrapper = new Promise((resolve) => {
          this.csgo.inspectItem(request.owner, request.assetid, request.d, resolve);
        });

        try {
          let steamResponse = await Promise.race([
            resolveWrapper,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('resolverTimeout')), STEAM_RESPONSE_TIMEOUT))
          ]);

          backoffFactor = 1
          let res = steamResponse

          try {
            request.resolves.map(resolve => resolve(res))
            this.queue.shift()
          } catch (e) {
            log.error(`Failed to insert ${prettify(request)} with err ${e}`)
            if (e && e.stack) {
              log.error(`${e.stack}`)
            }
          }
        } catch (e) {
          if (e.message.includes('resolverTimeout')) {

            log.error(`Response timeout for ${request.assetid}. Backing off for ${backoffFactor * STEAM_REQUEST_TIMEOUT} ms`);
            ++backoffFactor
          } else {
            log.error(`Failed to scan item ${prettify(request)} with ${e.stack}. Not increasing the backoff.`)
          }
        }
      } else {
        this.isScannerRunning = false
      }

      if(backoffFactor < 10){
        await new Promise(resolve => setTimeout(resolve, STEAM_REQUEST_TIMEOUT * backoffFactor));
      }
      else{
        process.exit(0)
      }
    }
  }

  scanSMAD(smad) {
    return new Promise(async (resolve, reject) => {
        this.queue.push({
          owner: smad.s || smad.m,
          assetid: smad.a,
          d: smad.d,
          resolves: [resolve],
        })

        if (!this.isScannerRunning) {
          this.runScanner()
        }
    })
  }
}

function prettify(request) {
  return JSON.stringify({ owner: request.owner, assetid: request.assetid, d: request.d });
}


module.exports = SteamScanner
