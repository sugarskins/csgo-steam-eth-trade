const CSGO_APP_ID = 730
const CSGO_CONTEXT_ID = 2

function isValidWearValue(wear) {
  return /^0\.\d+$/.test(wear)
}

function isSameWear(wear1, wear2) {
  if (!isValidWearValue(wear1)) {
    throw new Error(`Wear ${wear1} is invalid.`)
  }
  if (!isValidWearValue(wear2)) {
    throw new Error(`Wear ${wear2} is invalid.`)
  }

  const DIGITS = 14
  return wear1.slice(0, DIGITS) === wear2.slice(0, DIGITS)
}

async function sleep(millis) {
  await new Promise((resolve, reject) => {
    setTimeout(resolve, millis)
  })
}

function inspectLinkToSMAD(inspectLink) {
  const inspectLinkRegex = /([sm])([0-9]+)a([0-9]+)d([0-9]+)/i
  let match = inspectLink.toLowerCase().match(inspectLinkRegex)
  return {
    s: match[1] === 's' ? match[2] : null,
    m: match[1] === 'm' ? match[2] : null,
    a: match[3],
    d: match[4]
  }
}

function makeGroups(array, groupSize) {
  if (groupSize < 1) {
    throw new Error(`Group size ${groupSize} < 1.`)
  }

  const groups = []
  let group = []
  for (let i = 0; i < array.length; i++) {
    if (group.length < groupSize) {
      group.push(array[i])
    } else {
      groups.push(group)
      group = [array[i]]
    }
  }
  groups.push(group)
  return groups
}

module.exports = {
  isSameWear,
  inspectLinkToSMAD,
  sleep,
  makeGroups,
  CSGO_APP_ID,
  CSGO_CONTEXT_ID
}
