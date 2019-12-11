import React, { Component } from 'react'
import Button from 'react-bootstrap/Button'
import Table from 'react-bootstrap/Table'
import Modal from 'react-bootstrap/Modal'
import Axios from 'axios'
import Card from  'react-bootstrap/Card'
import Web3 from 'web3'
import listing from './listing'
import Badge from 'react-bootstrap/Badge'


const STAGE_TO_ALERT_VARIANT = {
    1: 'warning',
    2: 'warning',
    3: 'success',
}

class PurchaseHistoryComponent extends Component {

    constructor(props) {
        super(props)

        this.state = {
            web3: new Web3()
        }
    }

    render() {

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
                    </tr>
                </thead>
                <tbody>
                {
                    this.props.items.map((item, idx) => (
                        <tr key={idx}>
                            <th>{item.listingId}</th>
                            <th>{item.skinName}</th>
                            <th>{item.wear}</th>
                            <th>{this.state.web3.utils.fromWei(item.price,'ether')}</th>
                            <th><Badge variant={STAGE_TO_ALERT_VARIANT[item.stage]} >{listing.LISTING_STAGES[item.stage]} </Badge></th>
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