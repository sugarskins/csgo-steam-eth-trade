const {
  extractSteamIdFromTradeLinkPage,
  isSameWear,
  getInventoryUrl,
  getCsgoInventoryUrl } = require('../../src/utils')

const { InvalidWearValueError } = require('../../src/errors')


describe('isSameWear', () => {
  it('returns true for 2 identical wear strings', () => {
    const wear1 = '0.6945993900299072'
    const wear2 = '0.6945993900299072'
    expect(isSameWear(wear1, wear2)).toBe(true)
  })

  it('returns false for 2 wear strings that differ in the first decimal', () => {
    const wear1 = '0.6945993900299072'
    const wear2 = '0.5945993900299072'
    expect(isSameWear(wear1, wear2)).toBe(false)
  })

  it('returns true for 2 wear strings that differ in the 13th decimal', () => {
    /*
     this test showcases isSameWear fails for wears that differ in a digit past the 12th.
     However this is acceptable for the purpose of this comparison since the likelihood
     that 2 distinct items have 12 matching decimals with a 13th not matching is very low.
     (less than 1 in 100 billion)
     */
    const wear1 = '0.6945993900298072'
    const wear2 = '0.6945993900299072'
    expect(isSameWear(wear1, wear2)).toBe(true)
  })

  it('returns false for 2 wear strings that differ in the 12th decimal', () => {
    const wear1 = '0.6945993900289072'
    const wear2 = '0.6945993900299072'
    expect(isSameWear(wear1, wear2)).toBe(false)
  })

  it('throws InvalidWearValueError for when a wear value does not match expected pattern by starting with 1', () => {
    const wear1 = '1.6945993900289072'
    const wear2 = '0.6945993900299072'
    const callWithBadWear = () => isSameWear(wear1, wear2)
    expect(callWithBadWear).toThrowError(InvalidWearValueError)
  })

  it('throws InvalidWearValueError for when a wear value does not match expected pattern by having letters', () => {
    const wear1 = '0.6945abc939002890'
    const wear2 = '0.6945993900299072'
    const callWithBadWear = () => isSameWear(wear1, wear2)
    expect(callWithBadWear).toThrowError(InvalidWearValueError)
  })
})
