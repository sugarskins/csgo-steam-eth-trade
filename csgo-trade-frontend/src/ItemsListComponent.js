import React, { Component } from 'react'
// import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import Axios from 'axios'
import Card from  'react-bootstrap/Card'
import Container from  'react-bootstrap/Container'
import Row from  'react-bootstrap/Row'
import Col from  'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Navbar from 'react-bootstrap/Navbar'
import Badge from 'react-bootstrap/Badge'
import Nav from 'react-bootstrap/Nav'
import Web3 from 'web3'
import BigNumber from 'bignumber.js'
import {  withCookies } from 'react-cookie'
import CSGOSteamTradeContract from './CSGOSteamTrade'
import utils from './utils'
import SaleItemComponent from './SaleItemComponent'

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

class ItemData {
    constructor(listingId, wear, skinName, paintSeed, statTrak, inspectLink, inventoryLink, price, displayPrice, imageSrc) {
        this.listingId = listingId
        this.wear = wear
        this.skinName = skinName
        this.paintSeed = paintSeed
        this.statTrak = statTrak
        this.inspectLink = inspectLink
        this.inventoryLink = inventoryLink
        this.price = price
        this.displayPrice = displayPrice
        this.imageSrc = imageSrc
    }
}


const TEMP_PLACEHOLDER_PIC = 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot6-iFBRv7ODcfi9P6s65mpS0n_L1JaLummpD78A_0u2X9o332A22-UI5amuncYGdcwJtZ1nT_1S8w-i-g5Xt6p_LySdivT5iuyiWgPKs_g/330x192'
const TEMP_PLACEHOLDER_STATTRAK = false


function getDisplayPrice(price, ethToFiatPrice) {
    const etherValue = BigNumber((new Web3()).utils.fromWei(price, 'ether'))
    let displayPrice = null
    if (ethToFiatPrice) {

        const value = BigNumber(ethToFiatPrice.value).multipliedBy(etherValue)
        displayPrice = {
            value: value.toFixed(2),
            currency: ethToFiatPrice.currency
        }
    } else {
        displayPrice = {
            value: etherValue.toFixed(6),
            currency: 'ETH'
        }
    }
    return displayPrice
}

function contractListingToDisplayItem(listing, ethToFiatPrice) {
    const smad = utils.inspectLinkToSMAD(listing.ownerInspectLink)
    const inventoryURL = utils.getInventoryURL(smad)

    const displayPrice = getDisplayPrice(listing.price, ethToFiatPrice)

    const itemData = new ItemData(listing.listingId, listing.wear, listing.skinName, listing.paintSeed,
        TEMP_PLACEHOLDER_STATTRAK, listing.ownerInspectLink, inventoryURL, listing.price, displayPrice, TEMP_PLACEHOLDER_PIC)
    return itemData
}


const testItem1 = new ItemData(
    12,
    '0.6945993900299072',
    'AUG | Storm (Battle-Scarred)',
    '334',
    false,
    'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198862566094A16975411865D10106128984445219556',
    'https://steamcommunity.com/profiles/76561198862566094/inventory#730',
    '100000000000000000',
    "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot6-iFBRv7ODcfi9P6s65mpS0n_L1JaLummpD78A_0u2X9o332A22-UI5amuncYGdcwJtZ1nT_1S8w-i-g5Xt6p_LySdivT5iuyiWgPKs_g/330x192",
)

const testItems = []
const TEST_ITEM_COUNT = 12
for (let i = 0; i < TEST_ITEM_COUNT; i++) {
    const item = JSON.parse(JSON.stringify(testItem1))
    item.listingId = i
    testItems.push(item)
}
// function validateTradeURL(tradeURL) {
//     const { host, hostname, protocol, pathname, query } = new URL(tradeURL)
//     const parsedQuerystring = querystring.parse(query)
//     if (protocol !== 'https:' || host !== 'steamcommunity.com' || hostname !== 'steamcommunity.com' ||
//         pathname !== '/tradeoffer/new/' || !parsedQuerystring['partner'] || !parsedQuerystring['token']) {
//       throw InvalidTradeURLError(`The trade url ${tradeURL} is not a valid steamcommunity.com trade URL.`)
//     }
// }
  


const DISPLAY_CURRENCY = 'USD'
const COOKIE_TRADE_URL = 'TRADE_URL'

class ItemsListComponent extends Component {

    constructor(props) {
        super(props);

        const { cookies } = props

        this.state = {
            items: [],
            csgoSteamTradeContractAddress: '0x297ab0fbECE2ada3082516F9bC2D61d537EB46DC',
            userTradeURL: cookies.get(COOKIE_TRADE_URL),       
            ethToFiatPrice: null,
            errorState: null,
            ethNetworkURL: 'http://localhost:8545' 
        }

        console.info(`Loaded trade URL: ${this.state.userTradeURL}`)

        // this.state.items = testItems
        
        // eslint-disable-next-line             

        // eslint-disable-next-line            
        this.state.web3 = new Web3(this.state.ethNetworkURL)
        
        this.state.contractInstance = new this.state.web3.eth.Contract(
            CSGOSteamTradeContract.abi,
            this.state.csgoSteamTradeContractAddress,
            {}
          )

        this.handleTradeURLSubmit = this.handleTradeURLSubmit.bind(this)
    }

    async handleWeb3ConnectionFailure(e) {
        const message = `Failed to connect to the network ${this.state.ethNetworkURL} to fetch active listings. Refresh the page and check your internet connection.`
        console.error(`${message}. ${e.stack}`)
        await this.setState({
            errorState: {
                message
            }
        })
    }

    async componentDidMount() {
        console.info('ItemsListComponent componentDidMount')

        // TODO: pull all price suggestions here with competition data
        // this.setState({ componentMounted: true })

        let listingsCount = 0
        try {
            listingsCount = await this.state.contractInstance.methods.getListingsCount().call()
        } catch (e) {
            if (e.message.includes('is not a contract address')) {
                const message = `Provided ${this.state.csgoSteamTradeContractAddress} is not a valid contract address. Cannot load sale listings.`
                console.error(message)
                await this.setState({
                    errorState: {
                        message
                    }
                })
            } else {
                await this.handleWeb3ConnectionFailure(e)
            }
        }
        
        console.info(`Listings available: ${listingsCount}`)

        const listingIds = []
        for (let i = 0; i < listingsCount; i++) {
            listingIds.push(i)
        }

        let ethToFiatPrice = null
        try {
            const ethPricingResponse = await Axios.get(`https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=${DISPLAY_CURRENCY}`)
            const ethToFiatPriceValue = ethPricingResponse.data[DISPLAY_CURRENCY]
            console.info(`Succesfully fetched ETH/${DISPLAY_CURRENCY} price at ${ethToFiatPriceValue}`)
            ethToFiatPrice = {
                    value: ethToFiatPriceValue,
                    currency: DISPLAY_CURRENCY
            }
        } catch (e) {
            console.error(`Failed to load ETH/${DISPLAY_CURRENCY} pricing. ${e.stack}`)
        }

        let listings = []
  
        listings = await Promise.all(listingIds.map(id => this.state.contractInstance.methods.getListing(id).call()))
        
        console.info(`Fetched ${listings.length} listings`)
        console.info(listings[0])

        const displayItems = listings.map(listing => contractListingToDisplayItem(listing, ethToFiatPrice))

        console.log(displayItems[0])
        await this.setState({
            items: displayItems 
        })
    }

    async handleTradeURLSubmit(event) {
        event.preventDefault()
        const form = event.currentTarget
        const tradeURL = form.elements.formTradeURL.value
        console.info(`Saving trade URL saving ${tradeURL}`)
        this.props.cookies.set(COOKIE_TRADE_URL, tradeURL, { path: '/' })      
    }

    componentDidUpdate() {
        console.info('ItemsForSaleComponent updated.')

    }

    render() {
        const rowSize = 3
        const rowGroupedItems = makeGroups(this.state.items, rowSize)
        return (
            <div>
                { this.renderNavBar() }
                <div>
                    <h3> Buy CSGO Weapons using Ethereum payments secured with <a href="https://chain.link/"> Chainlink </a> </h3>
                    <p text="gray" >No sign in, no deposits, just sweet deals.</p>
                    { this.renderTradeDataForm() }
                    { this.state.errorState ? (<p>Error: {this.state.errorState.message}</p>) : null}
                </div>
                { this.renderItemListings(rowGroupedItems) }
            </div>
          );
    }

    renderNavBar() {
        return (
            <Navbar bg="light" expand="lg" bg="dark"  text="white"  >
            <Navbar.Brand href="#home">
                <img
                    src="/logo-sugarskins-1.png"
                    width="70"
                    height="70"
                    className="d-inline-block align-top"
                    alt="React Bootstrap logo"
                />
                </Navbar.Brand>
                <Nav.Link href="/"> Sugarskins </Nav.Link>
                <Nav.Link onClick={() => alert('wtf')}>Purchases <Badge variant="light">9</Badge>  </Nav.Link>
                <Nav.Link href="#help">Help </Nav.Link>
            </Navbar>
        )
    }

    renderTradeDataForm() {
        return (
            <Form onSubmit={this.handleTradeURLSubmit}>
            <Form.Group controlId="formTradeURL">
                <Form.Control type="url" placeholder="Enter Steam Community Trade URL" defaultValue={this.state.userTradeURL} />
                <Form.Text className="text-muted">
                    Make sure your Trade URL is valid AND your profile is *public*
                </Form.Text>
                <Form.Control.Feedback type="invalid">
                    Please provide a valid Trade URL.
                </Form.Control.Feedback>
            </Form.Group>
        </Form>
        )
    }

    renderItemListings(rowGroupedItems) {
        return (
            <Container>
            {rowGroupedItems.map((rowOfItems, rowIndex) => (
                <Row key={rowIndex}>
                    {rowOfItems.map(item => (
                        <Col key={item.listingId} >
                        <SaleItemComponent item={item}
                            userTradeURL={this.state.userTradeURL}
                            ethToFiatPrice={this.state.ethToFiatPrice}
                            csgoSteamTradeContractAddress={this.state.csgoSteamTradeContractAddress}>
                        </SaleItemComponent>
                        </Col>
                    ))}
                </Row>
            ))}
        </Container>
        )
    }
}


export default withCookies(ItemsListComponent)