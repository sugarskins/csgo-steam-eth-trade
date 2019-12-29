import React, { Component } from 'react'
import Axios from 'axios'
import Modal from 'react-bootstrap/Modal'
import Container from  'react-bootstrap/Container'
import Row from  'react-bootstrap/Row'
import Col from  'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Navbar from 'react-bootstrap/Navbar'
import Badge from 'react-bootstrap/Badge'
import Nav from 'react-bootstrap/Nav'
import Alert from 'react-bootstrap/Alert'
import Web3 from 'web3'
import BigNumber from 'bignumber.js'
import {  withCookies } from 'react-cookie'
import CSGOSteamTradeContract from './CSGOSteamTrade'
import utils from './utils'
import SaleItemComponent from './SaleItemComponent'
import PurchaseHistoryComponent from './PurchaseHistoryComponent'
import Spinner from 'react-bootstrap/Spinner'

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

    const extraItemData = JSON.parse(listing.extraItemData)

    const itemData = new ItemData(listing.listingId, listing.wear, listing.skinName, listing.paintSeed,
        extraItemData.statTrak, listing.ownerInspectLink, inventoryURL, listing.price, displayPrice, extraItemData.image)
    return itemData
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
const CONTRACT_ADDRESS_QUERY_PARAM = 'contractAddress'
const RPC_QUERY_PARAM = 'rpc'

const DEFAULT_RPC = 'https://ropsten.infura.io/v3/cf8c1af01b1d49198031f5f23baee111'

class ItemsListComponent extends Component {

    constructor(props) {
        super(props)

        const { cookies } = props

        const searchParams = new URLSearchParams(this.props.location.search)

        this.state = {
            items: [],
            listings: [],
            pastPurchases: [],
            csgoSteamTradeContractAddress: searchParams.get(CONTRACT_ADDRESS_QUERY_PARAM),
            userTradeURL: cookies.get(COOKIE_TRADE_URL),       
            ethToFiatPrice: null,
            errorState: null,
            ethNetworkURL: searchParams.get(RPC_QUERY_PARAM) || DEFAULT_RPC,
            showHistoryModal: false,
            initialLoadFinished: false
        }

        console.info(`Loaded trade URL: ${this.state.userTradeURL}`)      

        // eslint-disable-next-line            
        this.state.web3 = new Web3(this.state.ethNetworkURL)
        
        this.state.contractInstance = new this.state.web3.eth.Contract(
            CSGOSteamTradeContract.abi,
            this.state.csgoSteamTradeContractAddress,
            {}
          )

        this.handleTradeURLSubmit = this.handleTradeURLSubmit.bind(this)
        this.handleVendorContractSubmit = this.handleVendorContractSubmit.bind(this)
    }

    async handleWeb3ConnectionFailure(e) {
        const message = `Failed to connect to the network ${this.state.ethNetworkURL} to fetch active listings. Refresh the page and check your internet connection.`
        console.error(`${message}. ${e.stack}`)
        await this.setState({
            errorState: {
                message,
                alertVariant: 'danger'
            }
        })
    }

    async componentDidMount() {
        console.info('ItemsListComponent componentDidMount')
        
        let listingsCount = 0
        try {
            listingsCount = await this.state.contractInstance.methods.getListingsCount().call()

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
            console.info(`Fetched ${this.state.listings.length} listings`)
    
            let pastPurchases = []
    
            if (this.state.userTradeURL) {
                const matchingBuyerTradeURLHash = this.state.web3.utils.keccak256(this.state.userTradeURL)
    
                // TODO: use filter option for getPastEvents. Figure out why it doesn't work in its current form
                let pastPurchases = await this.state.contractInstance.getPastEvents(
                    'TradeDone', {
                        // filter: { buyerTradeURL: matchingBuyerTradeURLHash },
                        fromBlock: 0,
                        toBlock: 'latest' })
                pastPurchases = pastPurchases.filter(p => p.returnValues.buyerTradeURL === matchingBuyerTradeURLHash)
        
        
                console.info(`Fetched ${pastPurchases.length} past purchases for user.`)
                console.log(pastPurchases)
            }

            await this.setState({
                listings,
                pastPurchases,
                ethToFiatPrice,
                initialLoadFinished: true
            })
        } catch (e) {
            if (e.message.includes('is not a contract address')) {
                const message = `Provided ${this.state.csgoSteamTradeContractAddress} is not a valid contract address. Cannot load sale listings.`
                console.error(message)
                await this.setState({
                    errorState: {
                        message,
                        alertVariant: 'danger'
                    },
                    initialLoadFinished: true
                })
            } else if(e.message.includes(`please set an address first`)) {
                const message = `No contract address provided. Cannot load sale listings. Please set one.`
                console.error(message)
                await this.setState({
                    errorState: {
                        message,
                        alertVariant: 'primary'
                    },
                    initialLoadFinished: true
                })
            } else {
                await this.handleWeb3ConnectionFailure(e)
            }
        }
    }

    async handleTradeURLSubmit(event) {
        event.preventDefault()
        const form = event.currentTarget
        const tradeURL = form.elements.formTradeURL.value
        console.info(`Saving trade URL saving ${tradeURL}`)
        this.props.cookies.set(COOKIE_TRADE_URL, tradeURL, { path: '/' })      
    }

    async handleVendorContractSubmit(event) {
        event.preventDefault()
        const form = event.currentTarget
        const vendorContract = form.elements.formVendorContract.value
        console.info(`Saving vendor contract  ${vendorContract}`)

        this.props.history.push(`/?${CONTRACT_ADDRESS_QUERY_PARAM}=${vendorContract}`)
        window.location.reload()
    }

    componentDidUpdate() {
        console.info('ItemsForSaleComponent updated.')

    }

    render() {

        const displayItems = this.state.listings
            .filter(listing => listing.exists && !listing.purchaseOffer.exists)
            .map(listing => contractListingToDisplayItem(listing, this.ethToFiatPrice))

        const pendingPurchases = this.state.listings
            .filter(listing => listing.exists && listing.purchaseOffer.exists && listing.purchaseOffer.buyerTradeURL === this.state.userTradeURL)
        const rowSize = 3
        const rowGroupedItems = makeGroups(displayItems, rowSize)
        return (
            <div>
                { this.renderNavBar(pendingPurchases, this.state.pastPurchases) }
                <div>
                    <h3> Buy CSGO Weapons using Ethereum payments secured with smart contracts </h3>
                    <p text="dark" >No sign in, no deposits, no trusted middleman, just sweet deals.</p>
                    <Alert variant='info'>Sugarskins is currently alpha stage software. <a href="mailto:dan@danoctavian.com">Get in touch</a> about bugs and <a href="https://github.com/sugarskins">development</a>. Currently working on Ropsten network only.  </Alert>
                    { this.renderTradeDataForm() }
                    {!this.state.initialLoadFinished ? (<Spinner animation="border" variant="primary" />) : null }
                    { this.state.errorState ? (<Alert variant={this.state.errorState.alertVariant}> {this.state.errorState.message}</Alert> ) : null}
                </div>
                { this.renderHistoryModal(pendingPurchases, this.state.pastPurchases)  }
                { this.renderItemListings(rowGroupedItems) }
            </div>
          )
    }

    renderNavBar(pendingPurchases, pastPurchases) {
        return (
            <Navbar  expand="lg" bg="dark"  text="white"  >
            <Navbar.Brand href="/">
                <img
                    src="/logo-sugarskins-1.png"
                    width="70"
                    height="70"
                    className="d-inline-block align-top"
                    alt="React Bootstrap logo"
                />
                </Navbar.Brand>
                <Nav.Link > Sugarskins </Nav.Link>
                <Nav.Link onClick={() => this.setState({ showHistoryModal: true }) }>
                    Purchases {!this.state.initialLoadFinished ?
                        (<Spinner animation="border" variant="primary" />) : this.renderPurchaseCountsBadges(pendingPurchases, pastPurchases) }  
                </Nav.Link>
                <Nav.Link href="/help">Help </Nav.Link>
                <Nav.Link  href="https://github.com/sugarskins" > <img height="32" width="32" src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg" alt="Github logo" />  </Nav.Link>
            </Navbar>
        )
    }

    renderPurchaseCountsBadges(pendingPurchases, pastPurchases) {
        const processing = pendingPurchases.length
        const doneSuccessfully = pastPurchases.filter(p => p.returnValues.tradeOutcome === utils.TradeOutcome.SUCCESSFULLY_CONFIRMED.toString()).length
        const doneFailed = pastPurchases.filter(p => p.returnValues.tradeOutcome !== utils.TradeOutcome.SUCCESSFULLY_CONFIRMED.toString()).length
        return (
            <div style={{display:'inline-block'}}>
                <Badge variant="warning">{processing}</Badge> 
                <Badge variant="success">{doneSuccessfully}</Badge> 
                <Badge variant="danger">{doneFailed}</Badge> 
            </div>
        )
    }

    renderTradeDataForm() {
        return (
            <div>
                <Form className='App-trade-form' onSubmit={this.handleTradeURLSubmit}>
                    <Form.Group as={Row} controlId="formTradeURL">
                        <Form.Label column sm="2" >Steam Trade URL </Form.Label>
                        <Col sm="10">
                            <Form.Control style={{ width: 660 }} type="url" placeholder="Enter Steam Community Trade URL" defaultValue={this.state.userTradeURL} />
                        </Col>
                        <Form.Control.Feedback type="invalid">
                            Please provide a valid Trade URL.
                        </Form.Control.Feedback>
                    </Form.Group>
                </Form>
                <Form  className='App-trade-form' onSubmit={this.handleVendorContractSubmit}>
                    <Form.Group as={Row} type="text"  controlId="formVendorContract">
                        <Form.Label column sm="2" > Contract Address  </Form.Label>
                         <Col sm="10">
                            <Form.Control  style={{ width: 420 }} placeholder="Enter vendor Ethereum Contract Address" defaultValue={this.state.csgoSteamTradeContractAddress} />
                        </Col>
                    </Form.Group>
                </Form>
            </div>
        )
    }

    renderHistoryModal(pendingPurchases, pastPurchases) {
        return (
            <div>
            <Modal 
                bg="dark" 
                dialogClassName="modal-90w"
                show={this.state.showHistoryModal}
                onHide={() => this.setState( { showHistoryModal: false } )}
            >
                <Modal.Header closeButton>
                <Modal.Title>Purchase history</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <PurchaseHistoryComponent pendingPurchases={pendingPurchases} pastPurchases={pastPurchases}></PurchaseHistoryComponent>
                </Modal.Body>
            </Modal>
        </div>
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