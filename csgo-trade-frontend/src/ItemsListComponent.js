import React, { Component } from 'react'
import Button from 'react-bootstrap/Button'
// import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
// import Axios from 'axios'
import Card from  'react-bootstrap/Card'
import Container from  'react-bootstrap/Container'
import Row from  'react-bootstrap/Row'
import Col from  'react-bootstrap/Col'

import * as ethers from 'ethers'
import CSGOSteamTradeoContract from './CSGOSteamTrade'

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
    constructor(wear, skinName, paintSeed, statTrak, inspectLink, inventoryLink, price, imageSrc) {
        this.wear = wear
        this.skinName = skinName
        this.paintSeed = paintSeed
        this.statTrak = statTrak
        this.inspectLink = inspectLink
        this.inventoryLink = inventoryLink
        this.price = price
        this.imageSrc = imageSrc
    }
}

const testItem1 = new ItemData(
    '0.6945993900299072',
    'AUG | Storm (Battle-Scarred)',
    '334',
    false,
    'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198862566094A16975411865D10106128984445219556',
    'https://steamcommunity.com/profiles/76561198862566094/inventory#730',
    '100000000000000000',
    "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot6-iFBRv7ODcfi9P6s65mpS0n_L1JaLummpD78A_0u2X9o332A22-UI5amuncYGdcwJtZ1nT_1S8w-i-g5Xt6p_LySdivT5iuyiWgPKs_g/330x192",
)

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


class ItemComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showPurchaseModal: false,
            metamaskAvailable: false,
            metamaskPermissionGranted: false,
            metamaskEthers: null
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
        await this.setState({ showPurchaseModal: true })
    }

    async requestMetamaskAccess() {
        const metamaskEthereum = getMetamask()
        if (metamaskEthereum) {
            this.metamaskEthers = new ethers.providers.Web3Provider(metamaskEthereum)
            try {
                // Request account access if needed
                await metamaskEthereum.enable()
                console.info('Succesfully gained access to metamask.')
                await this.setState({ metamaskPermissionGranted: true})
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
        
    }


    render() {
        return (
            <div>
            <Card style={{ width: '18rem' }}  bg="dark"  text="white" >
                <Card.Img variant="top" src={this.props.item.imageSrc} />
                <Card.Body>
                <Card.Title>{this.props.item.skinName}</Card.Title>
                <Card.Text>
                    Price: {this.props.item.price}
                    Wear: {this.props.item.wear}
                    
                </Card.Text>
                <Card.Link href={this.props.item.inspectLink}>👀</Card.Link>
                <Card.Link href={this.props.item.inventoryLink} text="View on Steam">🚂</Card.Link>
                <Button variant="primary" onClick={this.handleShowPurchaseModal} > Purchase </Button>
                </Card.Body>
            </Card>
            <Modal size="lg" className="modal" show={this.state.showPurchaseModal} onHide={this.handleClosePurchaseModal}>
                    <Modal.Header closeButton>
                    <Modal.Title>Purchase</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                    { !this.state.metamaskAvailable ? (<div> ❗🦊 Please install the <a href='https://metamask.io/'>Metamask</a> browser
                    extension in order to make payments, and after refresh this page. </div>) : null }
                    { this.state.metamaskAvailable && !this.state.metamaskPermissionGranted ? (<div> ❗🦊 In order to purchase items, access to
                         your <a href='https://metamask.io/'>Metamask</a> address is required.
                         <Button type="button" className="btn btn-primary" onClick={this.requestMetamaskAccess} > Grant access </Button> </div>) : null }
                        <p> Details </p>

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


class ItemsListComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            items: [],
            csgoSteamTradeContractAddress: '0x297ab0fbECE2ada3082516F9bC2D61d537EB46DC'       
        }
        this.state.items = new Array(12)
        this.state.items.fill(testItem1)
        
        // eslint-disable-next-line             

        // eslint-disable-next-line             
        this.state.ethersProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545') // new ethers.providers.Web3Provider(web3.currentProvider)
        
        this.state.contractInstance = new ethers.Contract(this.state.csgoSteamTradeContractAddress, CSGOSteamTradeoContract.abi, this.state.ethersProvider)
        
    }

    async componentDidMount() {
        console.info('ItemsListComponent componentDidMount')

        // TODO: pull all price suggestions here with competition data
        this.setState({ componentMounted: true })

        // const suggestionsResponse = await Axios.get(`${this.props.url}/listings/suggestions`)
        // const suggestions = suggestionsResponse.data
        // console.info(`Loaded ${suggestions.length} suggestions`)
        // const items = [{

        // }]
        // await this.setState({ items: items })

        
        // this.state.web3js = web3
        // this.state.web3ContractInstance = this.state.web3js.eth.contract(
        //     CSGOSteamTradeoContract.abi).at(this.state.csgoSteamTradeContractAddress)

        const listingsCount = await this.state.contractInstance.getListingsCount()
        console.info(`Listings available: ${listingsCount}`)

        const listingIds = []
        for (let i = 0; i < listingsCount; i++) {
            listingIds.push(i)
        }

        const listings = await Promise.all(listingIds.map(id => this.state.contractInstance.getListing(id)))
        console.info(`Fetched ${listings.length} listings`)
    }

    componentDidUpdate() {
        console.info('ItemsForSaleComponent updated.')
    }

    render() {

        const rowSize = 3
        const rowGroupedItems = makeGroups(this.state.items, rowSize)
        return (
            <div className="form-group App-login">
                <Container>
                    {rowGroupedItems.map(rowOfItems => (
                        <Row>
                            {rowOfItems.map(item => (
                                <Col>
                                <ItemComponent item={item}> </ItemComponent>
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