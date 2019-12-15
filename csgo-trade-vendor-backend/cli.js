
const fs = require('fs')
const ListingManager = require('./src/ListingManager')

;(async () => {
  try {

    const argv = require('yargs')
      .option('listings', {
        type: 'array',
        desc: 'One or more listings with <item URL>,<price> pairs'
      })
      .option('credentials',{
        desc: 'Path to credentials file for Ethereum account private key and steam account credentials.'
      })
      .option('contract',{
        desc: 'Contract address of the vendor contract'
      })
      .option('rpc',{
        desc: 'HTTP Rpc address to use to connect to the Ethereum network.'
      })
      .help()
      .argv

    console.info(`Received ${argv.listings.length} listings to post.`)

    const credentialsFile = fs.readFileSync(argv.credentials, 'utf8')
    const credentials = JSON.parse(credentialsFile)

    const listingManager = new ListingManager(argv.rpc, argv.contract, credentials)

    await listingManager.setup(true)

    await listingManager.createListings(argv.listings)

    process.exit(0)
  } catch (e) {
    console.error(`FATAL: ${e.stack}`)
    process.exit(1)
  }
})()


