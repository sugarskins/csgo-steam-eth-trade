const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const config = require('./src/config')
const port = config.getPort() || 8080
const log = require('./src/log')
const steam = require('./src/steam')

app.use(bodyParser.json())

async function createRequest(input) {
  log.info(`Request received with data ${JSON.stringify(input)}`)
  let dataPayload = null
  switch (input.data.method.toLowerCase()) {
    case 'tradeurlownerhasinspectlinktarget':
      dataPayload = await handleTradeLinkOwnerHasInspectLinkTarget(input)
      break
    case 'inspectitem':
      dataPayload = await handleInspectItem(input)
      break
    default:
      return {
        response: {
          jobRunID: input.id,
          status: 'errored',
          error: 'Invalid method'
        },
        statusCode: 400
      }
  }

  const response = {
      response: {
        jobRunID: input.id,
        data: dataPayload,
        error: null
      },
      status: 200
  }
  return response
}

async function handleTradeLinkOwnerHasInspectLinkTarget(input) {
  const data = input.data
  const { containsItem, steamID64 } = await steam.inventoryContainsItemWithInspectLink(data.tradeURL, data.inspectLink,
    data.wear, data.skinName, data.paintSeed)
  return {
        containsItem: containsItem,
        steamID64
      }
}

async function handleInspectItem(input) {
  const data = input.data
  const item =await steam.inspectItem(data.inspectLink)
  return item
}


app.post("/",  async (req, res) => {
  await log.runWithContinuationId(null, async () => {
    try {
      const result = await createRequest(req.body)
      log.info(`Returning response ${JSON.stringify(result)}`)
      return res.json(result.response).status(result.statusCode)
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

const host = config.getHost() || '0.0.0.0'

app.listen(port, host, () => log.info(`Listening on port ${port} and host ${host}.`))
