import React, { Component } from 'react'
import Card from  'react-bootstrap/Card'
import Container from  'react-bootstrap/Container'
import Row from  'react-bootstrap/Row'
import Col from  'react-bootstrap/Col'
import CardDeck from 'react-bootstrap/CardDeck'
import utils from './utils'

class InfoCardsComponent extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        const genericInfoCards = [{
            img: '/ethereum_logo.png',
            title: 'Ethereum purchases',
            text: 'Purchase items with Ethereum. Enjoy a crystal clear smart contract defined delivery and refund policy.'
        }, {
            img: '/percentage_sign.png',
            title: 'Minimal fees',
            text: 'Pay only the standard fees incurred by doing Ethereum transactions.'
        },  {
            img: '/peertopeer_logo.png',
            title: 'Peer-to-peer',
            text: 'There is no trusted custodial middle-man holding the items and funds. The smart contract ensures that funds either are send to seller upon delivery or refunded to buyer on request.'
        }]
        const rowSize = 3
        const rowGroupedItems = utils.makeGroups(genericInfoCards, rowSize)
        return (
            <Container >
                {rowGroupedItems.map((rowOfItems, rowIndex) => (
                    <Row key={rowIndex}>
                         <CardDeck style={{display: 'flex', flexDirection: 'row', justifyContent: 'center' }} >
                        {rowOfItems.map(item => (
                            <Col key={item.title} >
                                <Card border="info" style={{ width: '18rem', flex: 1 }}  bg="dark"  text="white" >
                                    <Card.Img variant="top" src={item.img} />
                                    
                                    <Card.Body>
                                    <Card.Title style={{fontSize: 18}} > {item.title} </Card.Title>
                                    <Card.Text style={{fontSize: 14}} >
                                        {item.text}                   
                                    </Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                        </CardDeck>
                    </Row>
                ))}
            </Container> 
        )
    }
}

export default InfoCardsComponent