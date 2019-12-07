const express = require("express")
const bodyParser = require("body-parser")
const app = express()
const port = process.env.EA_PORT || 8080
const log = require('./src/log')
const steam = require('./src/steam')

app.use(bodyParser.json())

async function createRequest(input) {
  log.info(`Request received with data ${JSON.stringify(input)}`)
  switch (input.data.method.toLowerCase()) {
    case 'tradelinkownerhasinspectlinktarget':
      return await handleTradeLinkOwnerHasInspectLinkTarget(input)
    default:
      return {
        data: {
          jobRunID: input.id,
          status: 'errored',
          error: 'Invalid method'
        },
        status: 400
      }
  }
}

async function handleTradeLinkOwnerHasInspectLinkTarget(input) {
  const data = input.data
  const { containsItem, steamID64 } = await steam.inventoryContainsItemWithInspectLink(data.tradeURL, data.inspectLink,
    data.wear, data.skinName, data.paintSeed)
  return {
    data: {
      jobRunID: input.id,
      data: {
        containsItem: containsItem,
        steamID64
      },
      error: null
    },
    statusCode: 200
  }
}


app.post("/",  async (req, res) => {
  await log.runWithContinuationId(null, async () => {
    try {
      const result = await createRequest(req.body)
      log.info(`Returning response ${JSON.stringify(result)}`)
      return res.json(result.data).status(result.statusCode)
    } catch (e) {
      log.error(`Request failure: ${e.stack}`)
      return res.json({
        jobRunID: req.body.id,
        error: `Server error: ${e}`,
        status: 'errored'
      }).status(500)
    }
  })
})

app.listen(port, () => log.info(`Listening on port ${port}.`))
