const express = require("express")
const bodyParser = require("body-parser")
const app = express()
const port = process.env.EA_PORT || 8080
const log = require('./log')

app.use(bodyParser.json())


async function createRequest(req) {

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
});

app.listen(port, () => log.info(`Listening on port ${port}!`))
