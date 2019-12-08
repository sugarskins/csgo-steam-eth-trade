import React, { Component } from 'react'
import Button from 'react-bootstrap/Button'
// import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import Axios from 'axios'
import Card from  'react-bootstrap/Card'
import Container from  'react-bootstrap/Container'
import Row from  'react-bootstrap/Row'
import Col from  'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Web3 from 'web3'
import BigNumber from 'bignumber.js'
import CSGOSteamTradeoContract from './CSGOSteamTrade'
import utils from './utils'

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

function getMetamask() {
    if (typeof window.ethereum !== 'undefined') {
        console.log('Metamask web3 is enabled')       
        // eslint-disable-next-line     
        return window.ethereum
      } else {
        console.info('web3 is not found')
        return false
      }
}

// function validateTradeURL(tradeURL) {
//     const { host, hostname, protocol, pathname, query } = new URL(tradeURL)
//     const parsedQuerystring = querystring.parse(query)
//     if (protocol !== 'https:' || host !== 'steamcommunity.com' || hostname !== 'steamcommunity.com' ||
//         pathname !== '/tradeoffer/new/' || !parsedQuerystring['partner'] || !parsedQuerystring['token']) {
//       throw InvalidTradeURLError(`The trade url ${tradeURL} is not a valid steamcommunity.com trade URL.`)
//     }
// }
  


class ItemComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showPurchaseModal: false,
            metamaskAvailable: false,
            metamaskPermissionGranted: false,
            metamaskWeb3: null,
            contractInstance: null
        }

        this.handleShowPurchaseModal = this.handleShowPurchaseModal.bind(this)
        this.handleClosePurchaseModal = this.handleClosePurchaseModal.bind(this) 
        this.handlePurchaseRequest = this.handlePurchaseRequest.bind(this) 
        this.requestMetamaskAccess = this.requestMetamaskAccess.bind(this)
    }

    async componentDidMount() {
        const metamaskEthereum = getMetamask()
        await this.setState({ metamaskAvailable: metamaskEthereum })
    }

    async handleShowPurchaseModal() {
        await this.requestMetamaskAccess()
        await this.setState({ showPurchaseModal: true })
    }

    async requestMetamaskAccess() {
        const metamaskEthereum = getMetamask()
        if (metamaskEthereum) {
            const metamaskWeb3 = new Web3(window.web3.currentProvider)
            const contractInstance = new metamaskWeb3.eth.Contract(
                CSGOSteamTradeoContract.abi,
                this.props.csgoSteamTradeContractAddress,
                {}
              )
            await this.setState({ contractInstance, metamaskWeb3 })
            try {
                // Request account access if needed
                await metamaskEthereum.enable()
                console.info('Succesfully gained access to metamask.')


                await this.setState({ metamaskPermissionGranted: true })
            } catch (error) {
                // User denied account access...
                console.error('Failed to gain access to metamask.')
                await this.setState({ metamaskPermissionGranted: false })
            }
        }
    }

    async handleClosePurchaseModal() {
        await this.setState({ showPurchaseModal: false })
    }

    async handlePurchaseRequest() {
        console.info('Attempting purchase..')
        // await this.state.contractInstance.
        this.state.contractInstance.methods.createPurchaseOffer()
    }


    render() {
        return (
            <div>
            <Card style={{ width: '18rem' }}  bg="dark"  text="white" >
                <Card.Img variant="top" src={this.props.item.imageSrc} />
                <Card.Body>
                <Card.Title>{this.props.item.skinName}</Card.Title>
                <Card.Text>
                    Price: {this.props.item.displayPrice.value} {this.props.item.displayPrice.currency}
                    Wear: {this.props.item.wear}
                    
                </Card.Text>
                <Card.Link href={this.props.item.inspectLink}>
                    <span role="img" aria-label="eyes">👀</span>
                </Card.Link>

                <Card.Link href={this.props.item.inventoryLink} text="View on Steam">
                    <span role="img" aria-label="steam-train"> 🚂</span>
                </Card.Link>
                <Button variant="primary" onClick={this.handleShowPurchaseModal} > Purchase </Button>
                </Card.Body>
            </Card>
            <Modal size="lg" className="modal" show={this.state.showPurchaseModal} onHide={this.handleClosePurchaseModal}>
                    <Modal.Header closeButton>
                    <Modal.Title>Purchase</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                    { !this.state.metamaskAvailable ? (<div> <span role="img" aria-label="exclamation-mark">❗</span> <span role="img" aria-label="fox">🦊</span> Please install
                     the <a href='https://metamask.io/'>Metamask</a> browser
                    extension in order to make payments, and after refresh this page. </div>) : null }
                    { this.state.metamaskAvailable && !this.state.metamaskPermissionGranted ? (<div> <span role="img" aria-label="exclamation-mark">❗</span> <span role="img" aria-label="fox">🦊</span> 
                    In order to purchase items, access to
                         your <a href='https://metamask.io/'>Metamask</a> address is required.
                         <Button type="button" className="btn btn-primary" onClick={this.requestMetamaskAccess} > Grant access </Button> </div>) : null }
                        <p>{this.props.item.skinName}</p>
                        <p>Price: {this.props.item.displayPrice.value} {this.props.item.displayPrice.currency}</p>
                        <p>Wear: {this.props.item.wear}</p>

                    </Modal.Body>
                    <Modal.Footer>

                    <button type="button" className="btn btn-primary" disabled={!this.state.metamaskAvailable || !this.state.metamaskPermissionGranted }  onClick={this.handlePurchaseRequest} > Purchase </button>
                    <a href={this.props.item.inspectLink}><button type="button" className="btn btn-primary"> View on Steam </button></a>
                    <Button variant="secondary" onClick={this.handleClosePurchaseModal}>
                        Close
                    </Button>
                    </Modal.Footer>
            </Modal>
          </div>
        )
    }
}


const DISPLAY_CURRENCY = 'USD'

class ItemsListComponent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            items: [],
            csgoSteamTradeContractAddress: '0x297ab0fbECE2ada3082516F9bC2D61d537EB46DC',
            userTradeURL: null,       
            ethToFiatPrice: null
        }

        // this.state.items = testItems
        
        // eslint-disable-next-line             

        // eslint-disable-next-line             
        this.state.web3 = new Web3('http://localhost:8545')
        
        this.state.contractInstance = new this.state.web3.eth.Contract(
            CSGOSteamTradeoContract.abi,
            this.state.csgoSteamTradeContractAddress,
            {}
          )

        this.handleTradeURLSubmit = this.handleTradeURLSubmit.bind(this)
    }

    async componentDidMount() {
        console.info('ItemsListComponent componentDidMount')

        // TODO: pull all price suggestions here with competition data
        // this.setState({ componentMounted: true })

        const listingsCount = await this.state.contractInstance.methods.getListingsCount().call()
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

        const listings = await Promise.all(listingIds.map(id => this.state.contractInstance.methods.getListing(id).call()))
        
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
        console.log('Handle trade URL submit')
        console.log(event.currentTarget.value)
        //this.setState({ tradeURL:  })        
    }

    componentDidUpdate() {
        console.info('ItemsForSaleComponent updated.')

    }

    render() {
        const rowSize = 3
        const rowGroupedItems = makeGroups(this.state.items, rowSize)
        return (
            <div className="form-group App-login">
                <Form onSubmit={this.handleTradeURLSubmit}>
                    <Form.Group controlId="formTradeURL">
                        <Form.Label>Your Trade URL </Form.Label>
                        <Form.Control type="url" placeholder="Enter Steam Community trade URL" />
                        <Form.Text className="text-muted">
                            Make sure your trade URL is valid AND your profile is *public*
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                            Please provide a valid city.
                        </Form.Control.Feedback>
                    </Form.Group>
                </Form>
                <Container>
                    {rowGroupedItems.map((rowOfItems, rowIndex) => (
                        <Row key={rowIndex}>
                            {rowOfItems.map(item => (
                                <Col key={item.listingId} >
                                <ItemComponent item={item}
                                    ethToFiatPrice={this.state.ethToFiatPrice}
                                    csgoSteamTradeContractAddress={this.state.csgoSteamTradeContractAddress}>
                                </ItemComponent>
                                </Col>
                            ))}
                        </Row>
                    ))}
                </Container>
            </div>
          );
    }
}


export default ItemsListComponent