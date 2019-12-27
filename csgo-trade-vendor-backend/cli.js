
const fs = require('fs')
const yargs = require('yargs')
const ListingManager = require('./src/ListingManager')

const CREDENTIALS_DESC = 'Path to credentials file for Ethereum account private key and steam account credentials.'
const CONTRACT_DESC = 'Contract address of the vendor contract'
const RPC_DESC = 'HTTP Rpc address to use to connect to the Ethereum network.'

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
          .option('credentials', {
            desc: CREDENTIALS_DESC
          })
          .option('contract',{
            desc: CONTRACT_DESC
          })
          .option('rpc',{
            desc: RPC_DESC
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
          .option('contract', {
            desc: CONTRACT_DESC
          })
          .option('rpc',{
            desc: RPC_DESC
          })
          .help().argv

        const listingManager = new ListingManager(argv.rpc, argv.contract)
        await listingManager.setup(false)
        const currentListings = await listingManager.getListings()
        console.log(currentListings)
      })
      .command('confirm', 'request item delivery confirmation', async (yargs) => {
        const argv = yargs
          .option('contract', {
            desc: CONTRACT_DESC
          })
          .option('rpc', {
            desc: RPC_DESC
          })
          .option('credentials', {
            desc: CREDENTIALS_DESC
          })
          .option('id', {
            desc: 'Listing id'
          })
          .option('oracle', {
            desc: 'Address of oracle to be used.'
          })
          .option('jobid', {
            desc: 'Job id to run for oracle to confirm'
          })
          .option('inspectlink', {
            desc: `Inspect link for the item in the buyer's inventory`
          })
          .help().argv

          try {

            const credentialsFile = fs.readFileSync(argv.credentials, 'utf8')
            const credentials = JSON.parse(credentialsFile)

            const listingManager = new ListingManager(argv.rpc, argv.contract, credentials)
            await listingManager.setup(false)
            await listingManager.validateItemDelivery(argv.id, argv.oracle, argv.jobid, argv.inspectlink)
          } catch (e) {
            console.error(`FATAL :${e.stack}`)
            process.exit(1)
          }
      })
      .command('deploy', 'deploy trade contract', async () => {
        const argv = yargs
          .option('rpc', {
            desc: RPC_DESC
          })
          .option('credentials', {
            desc: CREDENTIALS_DESC
          })
          .option('link', {
            desc: `contract address for the LINK token. (if not specified and it's a known network it will be picked automatically`
          })
          .help().argv

        try {
          const credentialsFile = fs.readFileSync(argv.credentials, 'utf8')
          const credentials = JSON.parse(credentialsFile)

          await ListingManager.deployContract(argv.rpc, credentials, argv.link)
        } catch (e) {
          console.error(`Failed: ${e.stack}`)
          process.exit(1)
        }

      })
      .command('delete', 'delete listing', async (yargs) => {
        const argv = yargs
          .option('contract', {
            desc: CONTRACT_DESC
          })
          .option('rpc', {
            desc: RPC_DESC
          })
          .option('credentials', {
            desc: CREDENTIALS_DESC
          })
          .option('ids', {
            type: 'array',
            desc: 'One or more listing ids to delete'
          })
          .help().argv

        try {

          const credentialsFile = fs.readFileSync(argv.credentials, 'utf8')
          const credentials = JSON.parse(credentialsFile)

          const listingManager = new ListingManager(argv.rpc, argv.contract, credentials)
          await listingManager.setup(false)
          await listingManager.deleteListings(argv.ids)
        } catch (e) {
          console.error(`FATAL: ${e.stack}`)
          process.exit(1)
        }

      })
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


