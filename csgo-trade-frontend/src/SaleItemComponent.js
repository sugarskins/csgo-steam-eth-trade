import React, { Component } from 'react'
import Button from 'react-bootstrap/Button'
// import ListGroup from 'react-bootstrap/ListGroup'
import Modal from 'react-bootstrap/Modal'
import Card from  'react-bootstrap/Card'
import Alert from  'react-bootstrap/Alert'
import Web3 from 'web3'

import CSGOSteamTradeContract from './CSGOSteamTrade'

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

const PURCHASE_STATUSES = {
    REQUESTED_SUCCESFULLY: {
        message: 'Purchase requested succesfully. You will soon receive a Trade Offer from the seller.',
        variant: 'info'
    },
    REQUEST_FAILED: (failureReason) => {
        return  {
            message: `Failed to request purchase. Reason: ${failureReason}`,
            variant: 'danger'
        }
    }
}

class SaleItemComponent extends Component {
    constructor(props) {
        super(props)
        this.state = {
            showPurchaseModal: false,
            metamaskAvailable: false,
            metamaskPermissionGranted: false,
            metamaskWeb3: null,
            contractInstance: null,
            purchaseStatus: null
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
                CSGOSteamTradeContract.abi,
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
        console.info(`Creating purchase offer for listingId ${this.props.item.listingId} with trade URL ${this.props.userTradeURL} `)
        
        try {
            const response =  await this.state.contractInstance.methods
            .createPurchaseOffer(this.props.item.listingId, this.props.userTradeURL)
            .send({
                from: window.web3.eth.defaultAccount,
                value: this.props.item.price
            })

            await this.setState({
                purchaseStatus: PURCHASE_STATUSES.REQUESTED_SUCCESFULLY,
            })
        console.info(response)
        } catch (e) {
            console.error(`Failed to submit purchase offer to the contract. ${e.stack}`)
            await this.setState({
                purchaseStatus: PURCHASE_STATUSES.REQUEST_FAILED(e.message)
            })
        }

    }


    render() {
        return (
            <div>
            <Card border="primary" style={{ width: '18rem' }}  bg="dark"  text="white" >
                <Card.Img variant="top" src={this.props.item.imageSrc} />
                <Card.Body>
                <Card.Title style={{fontSize: 14}} > {this.props.item.skinName} {this.props.item.statTrak ? 'StatTrak™' : null} </Card.Title>
                <Card.Text style={{fontSize: 14}} >
                   {this.props.item.displayPrice.value} {this.props.item.displayPrice.currency}                    
                </Card.Text>
                <Card.Text style={{fontSize: 12}}>
                    Wear: {this.props.item.wear}
                </Card.Text>
                <Card.Text style={{fontSize: 12}}>
                    Paint seed: {this.props.item.paintSeed}
                </Card.Text>
                <Card.Link href={this.props.item.inspectLink}>
                    <span role="img" aria-label="eyes">👀</span>
                </Card.Link>

                <Card.Link href={this.props.item.inventoryLink} target="_blank" text="View on Steam">
                <img height="32" width="32" src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/steam.svg" />
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
                        {this.state.purchaseStatus ? (<Alert variant={this.state.purchaseStatus.variant}> {this.state.purchaseStatus.message} </Alert>) : null}
                    </Modal.Body>
                    <Modal.Footer>

                    <button type="button" className="btn btn-primary" disabled={!this.state.metamaskAvailable || !this.state.metamaskPermissionGranted }  onClick={this.handlePurchaseRequest} > Purchase </button>
                    <a href={this.props.item.inspectLink}><button type="button" className="btn btn-primary"> View on Steam </button></a>
                    <a target="_blank" href={this.props.item.inventoryLink}><button type="button" className="btn btn-primary"> View in inventory </button></a>
                    <Button variant="secondary" onClick={this.handleClosePurchaseModal}>
                        Close
                    </Button>
                    </Modal.Footer>
            </Modal>
          </div>
        )
    }
}


export default SaleItemComponent