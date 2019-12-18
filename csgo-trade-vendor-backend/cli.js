
const fs = require('fs')
const yargs = require('yargs')
const ListingManager = require('./src/ListingManager')

;(async () => {
  try {

    const argv = require('yargs')
      .usage('usage: $0 <command>')
      .command('create', 'create new listings', async (yargs) => {
        const argv = yargs
          .option('listings', {
            type: 'array',
            desc: 'One or more listings with <item inspect link>,<price> pairs'
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
          .option('dedupe', {
            desc: 'Scans the contract active listings to prevent posting of duplicate listings'
          }).help().argv

          console.info(`Received ${argv.listings.length} listings to post.`)

          const credentialsFile = fs.readFileSync(argv.credentials, 'utf8')
          const credentials = JSON.parse(credentialsFile)

          const listingManager = new ListingManager(argv.rpc, argv.contract, credentials)

          await listingManager.setup(true)

          await listingManager.createListings(argv.listings, argv.dedupe)


          process.exit(0)
      })
      .command('list', 'list existing listings', async (yargs) => {
        const argv = yargs
          .option('contract',{
            desc: 'Contract address of the vendor contract'
          })
          .option('rpc',{
            desc: 'HTTP Rpc address to use to connect to the Ethereum network.'
          })
          .help().argv

        const listingManager = new ListingManager(argv.rpc, argv.contract)
        await listingManager.setup(false)
        const currentListings = await listingManager.getListings()
        console.log(currentListings)
      })
      .command('delete')
      .help('help')
      .wrap(null)
      .argv

    checkCommands(yargs, argv, 1)

    function checkCommands(yargs, argv, numRequired) {
      if (argv._.length < numRequired) {
        yargs.showHelp()
      } else {
        console.error(`Unknown command.`)
      }
    }
  } catch (e) {
    console.error(`FATAL: ${e.stack}`)
    process.exit(1)
  }
})()


