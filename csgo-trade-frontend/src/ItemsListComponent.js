import React, { Component } from 'react'
import Button from 'react-bootstrap/Button'
// import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
// import Axios from 'axios'
import Card from  'react-bootstrap/Card'
import Container from  'react-bootstrap/Container'
import Row from  'react-bootstrap/Row'
import Col from  'react-bootstrap/Col'
// import Web3 from 'web3'
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
    "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpoo7e1f1Jf2-r3dTlS7ciJgZKJqPrxN7LEm1Rd6dd2j6eUoNyn2wXir0Q4YGD3J4aVcw8_N1rZ-gK-lO-5gMe8uZqam3dhuHIj-z-DyAPtZave/330x192"
)


class ItemComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showPurchaseModal: false
        }


        this.handleShowPurchaseModal = this.handleShowPurchaseModal.bind(this)
        this.handleClosePurchaseModal = this.handleClosePurchaseModal.bind(this) 
    }

    async checkForMetamask() {
        if (typeof web3 !== 'undefined') {
            console.log('web3 is enabled')       
            // eslint-disable-next-line     
            if (web3.currentProvider.isMetaMask === true) {
              console.info('MetaMask is active')
            } else {
              console.info('MetaMask is not available')
            }
          } else {
            console.info('web3 is not found')
          }
    }

    async handleShowPurchaseModal() {
        await this.setState({ showPurchaseModal: true })
    }

    async handleClosePurchaseModal() {
        await this.setState({ showPurchaseModal: false })
    }


    render() {
        return (
            <div>
            <Card style={{ width: '18rem' }}>
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
            <Modal size="lg" show={this.state.showPurchaseModal} onHide={this.handleClosePurchaseModal}>
                    <Modal.Header closeButton>
                    <Modal.Title>Purchase</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p> Details </p>
                    </Modal.Body>
                    <Modal.Footer>
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
            items: []       
        }
        this.state.items = new Array(12)
        this.state.items.fill(testItem1)
        
        // eslint-disable-next-line             

        // eslint-disable-next-line             
        this.state.ethersProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545') // new ethers.providers.Web3Provider(web3.currentProvider)

        const csgoSteamTradeContractAddress = '0x297ab0fbECE2ada3082516F9bC2D61d537EB46DC'

        // this.state.contractInstance = this.state.web3js.eth.contract(
        //     CSGOSteamTradeoContract.abi).at(csgoSteamTradeContractAddress)
        
        this.state.contractInstance = new ethers.Contract(csgoSteamTradeContractAddress, CSGOSteamTradeoContract.abi, this.state.ethersProvider)
        
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