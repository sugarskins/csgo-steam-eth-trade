const express = require("express")
const bodyParser = require("body-parser")
const app = express()
const port = process.env.EA_PORT || 8080
const log = require('./src/log')
const steam = require('./src/steam')

app.use(bodyParser.json())

const CONTAINS_ITEM_FALSE = 0
const CONTAINS_ITEM_TRUE = 1
const CONTAINS_ITEM_INVENTORY_PRIVATE = 2


async function createRequest(input) {
  log.info(`Request received with data ${JSON.stringify(input)}`)
  switch (input.data.method.toLowerCase()) {
    case 'checkinventorycontainscsgoweapon':
      const data = input.data
      const { containsItem, steamId } = await steam.inventoryContainsItem(data.tradeLink,
        data.wear, data.skinName, data.paintSeed)
      return {
        data: {
          jobRunID: input.id,
          data: {
            containsItem: containsItem ? CONTAINS_ITEM_TRUE : CONTAINS_ITEM_FALSE,
            steamId
          },
          error: null
        },
        statusCode: 200
      }
      break
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

app.post("/",  async (req, res) => {
  try {
    const result = await createRequest(req.body)
    log.info(`Returning response ${JSON.stringify(result)}`)
    return res.json(result.data).status(result.statusCode)
  } catch (e) {
    log.error(`Request failure: ${e.stack}`)
    return res.json({
      jobRunID: req.body.id,
      error: 'Server error.',
      status: 'errored'
    }).status(500)
  }
})

app.listen(port, () => log.info(`Listening on port ${port}.`))
