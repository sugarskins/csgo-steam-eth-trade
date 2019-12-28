const axios = require('axios')

async function makeRequest(i) {
  const wear = '0.6945993900299072'
  const tradeURL = 'https://steamcommunity.com/tradeoffer/new/?partner=902300366&token=HYgPwBhA'
  const inspectLink = 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198862566094A16975411865D479860722137102858'
  const skinName = 'AUG | Storm (Battle-Scarred)'
  const paintSeed = '334'

  let apiURL = 'http://localhost:8080'

  try {
    console.log(`Making request ${i}`)
    const result = await axios.post(apiURL, {
      data: {
        method: 'tradeurlownerhasinspectlinktarget',
        tradeURL,
        inspectLink,
        wear,
        skinName,
        paintSeed
      }
    })

    console.log(`Finished request ${i}`)
    console.log(result.data)
  } catch (e) {
    console.error(`Failed request ${i}`)
  }

}

;(async () => {
  try {
    const waves = 5
    const waveSize = 3
    for (let j = 0; j < waves * waveSize; j += waveSize) {
      console.log(`Wave ${j}`)
      var is = []
      for (var i = j; i <= j + waveSize; i++) {
        is.push(i)
      }

      const requests = is.map(i => makeRequest(i))
      await Promise.all(requests)

      await new Promise((resolve, reject) => {
        setTimeout(resolve, 2000)
      })
    }


  } catch (e) {
    console.error(`FATAL: ${e.stack}`)
    process.exit(1)
  }
})()
