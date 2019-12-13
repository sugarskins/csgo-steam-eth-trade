const CSGO_APP_ID = 730
const CSGO_CONTEXT_ID = 2

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


function getInventoryURL(smad) {
    return `https://steamcommunity.com/profiles/${smad.s}/inventory#${CSGO_APP_ID}_${CSGO_CONTEXT_ID}_${smad.a}`
}

export default {
    inspectLinkToSMAD,
    getInventoryURL
}