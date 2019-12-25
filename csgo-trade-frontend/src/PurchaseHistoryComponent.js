import React, { Component } from 'react'
import Table from 'react-bootstrap/Table'
import Web3 from 'web3'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import utils from './utils'

function getStatusBadge(item) {
    if (item.pending) {
        return {
            variant: 'warning',
            text: 'Pending delivery'
        }
    } else {
        if (item.tradeOutcome === utils.TradeOutcome.DELETED_LISTING.toString()) {
            return {
                variant: 'danger',
                text: 'Deleted by vendor'
            }
        } else if (item.tradeOutcome === utils.TradeOutcome.SUCCESSFULLY_CONFIRMED.toString()) {
            return {
                variant: 'success',
                text: 'Delivered'
            }
        } else if (item.tradeOutcome === utils.TradeOutcome.UNABLE_TO_CONFIRM_PRIVATE_PROFILE.toString()) {
            return {
                variant: 'danger',
                text: 'Profile was private'
            }
        } else {
            return {
                variant: 'info',
                text: 'Unknown'
            }
        }
    }
}

class PurchaseHistoryComponent extends Component {

    constructor(props) {
        super(props)

        this.state = {
            web3: new Web3()
        }
    }

    render() {

        const pendingItems = this.props.pendingPurchases
        pendingItems.forEach(i => {
            i.pending = true
        })
        pendingItems.sort((item1, item2) => item2.purchaseOffer.creationTimestamp - item1.purchaseOffer.creationTimestamp)

        this.props.pastPurchases.sort((p1, p2) => p1.blockNumber - p2.blockNumber)
        const pastItems = this.props.pastPurchases.map(past => {
            const listing = past.returnValues.listing
            listing.tradeOutcome = past.returnValues.tradeOutcome
            return listing
        })
        const allItems = pendingItems.concat(pastItems)

        console.log(this.props.items)
        return (
            <div>
                <Table>
                <thead>
                    <tr key={-1}>
                                <th>Listing Id </th>
                                <th> Skin Name </th>
                                <th> Wear </th>
                                <th> Price (ETH) </th>
                                <th> Status </th>
                                <th> Action </th>
                    </tr>
                </thead>
                <tbody>
                {
                    allItems
                        
                        .map((item, idx) => (
                        <tr key={idx}>
                            <th>{item.listingId}</th>
                            <th>{item.skinName}</th>
                            <th>{item.wear}</th>
                            <th>{this.state.web3.utils.fromWei(item.price,'ether')}</th>
                            <th><Badge variant={getStatusBadge(item).variant} > {getStatusBadge(item).text} </Badge></th>
                            <th> {item.pending ? (<Button variant='outline-danger'> Cancel </Button>)
                                    : (<Button variant='secondary' disabled={true}> None </Button>)} </th>
                        </tr>
                    ))
                }
                </tbody>
                </Table>
            </div>
        )   
    }
}

export default PurchaseHistoryComponent