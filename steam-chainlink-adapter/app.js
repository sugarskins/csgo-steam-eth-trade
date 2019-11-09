const express = require("express")
const bodyParser = require("body-parser")
const app = express()
const port = process.env.EA_PORT || 8080
const log = require('./src/log')
const steam = require('./src/steam')

app.use(bodyParser.json())


async function createRequest(input) {
  log.info(`Request recieved with data ${JSON.stringify(input.data)}`)
  switch (input.data.method.toLowerCase()) {
    case "checkinventorycontainsitem":
      const data = input.data
      const containsItem = await steam.inventoryContainsItem(data.accountName, data.steamId, data.wear, data.skinName, data.paintSeed)
      return {
        data: {
          jobRunID: input.id,
          data: {
            containsItem
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
    return res.json(result.data).status(result.statusCode)
  } catch (e) {
    log.error(`Request failure: ${e.stack}`)
    return res.json({
      message: 'Server error.'
    }).status(500)
  }
})

app.listen(port, () => log.info(`Listening on port ${port}.`))
