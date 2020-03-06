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

const TradeOutcome = {
    SUCCESSFULLY_CONFIRMED: 0,
    UNABLE_TO_CONFIRM_PRIVATE_PROFILE: 1,
    DELETED_LISTING: 2
}

function getTimeDifference(future, past) {
        // get total seconds between the times
    var delta = Math.abs(future - past) / 1000

    // calculate (and subtract) whole days
    var days = Math.floor(delta / 86400)
    delta -= days * 86400

    // calculate (and subtract) whole hours
    var hours = Math.floor(delta / 3600) % 24
    delta -= hours * 3600
    // calculate (and subtract) whole minutes
    var minutes = Math.floor(delta / 60) % 60
    delta -= minutes * 60

    // what's left is seconds
    var seconds = delta % 60  // in theory the modulus is not required
    return {
        days,
        hours,
        minutes,
        seconds: Math.floor(seconds)
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

export function getMetamask() {
    if (typeof window.ethereum !== 'undefined') {
        console.log('Metamask web3 is enabled')       
        // eslint-disable-next-line     
        return window.ethereum
      } else {
        console.info('web3 is not found')
        return false
      }
}


export default {
    inspectLinkToSMAD,
    getInventoryURL,
    TradeOutcome,
    getTimeDifference,
    makeGroups,
    getMetamask
}