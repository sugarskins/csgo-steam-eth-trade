import React, { Component } from 'react'
import Navbar from 'react-bootstrap/Navbar'
import Badge from 'react-bootstrap/Badge'
import Nav from 'react-bootstrap/Nav'

class HelpComponent extends Component {
    render() {
        return (
        <div >
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
                <Nav.Link href="/" > Trading page </Nav.Link>
                <Nav.Link  href="https://github.com/sugarskins" > <img height="32" width="32" src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg" alt="Github logo" />  </Nav.Link>
            </Navbar>
            <h1>Help</h1>
            <br></br>
            <br></br>

            <h2> What is SugarSkins? </h2>
            <p> SugarSkins is a collection of tools that allows you to trade <a href='https://steamcommunity.com/market/search?appid=730'> Counter Strike: Global Offensive weapons </a> outside the official market in a way that protects both the buyer and seller from fraud and without using a trusted middleman market and by using Ethereum payments.</p>

            <h2> How does it work? </h2>
                SugarSkins works by enabling vendors to post their listings within an < a href="https://ethereum.org/">Ethereum smart contract</a> which defines precise rules as to when the funds can reach the seller and when the buyer can ask for a refund.
                It uses the <a href="https://chain.link/"> Chainlink </a> technology to establish that an item with a unique wear and paint seed is currently owned by the buyer's account to allow the seller to access the funds
                If the smart contract cannot establish that the item has reached the buyer's account within 6 hours of the creation of the purchase offer, the buyer can request a refund which will be fulfilled automatically.

                For a detailed technical understanding of the smart contract, oracle and frontend visit the page on <a href="https://github.com/sugarskins">Github </a>.
            <h2> What are the fees? </h2>
            <p> Currently using SugarSkins means you will pay for standard Ethereum gas fees upon submitting your purchase offer, or asking for a refund.
                These generally amount to less than 1 USD regardless of the total value of the item being processed. </p>

            <h3> Why use SugarSkins and not  [insert third-party steam trade marketplace] ?  </h3>
            <p> SugarSkins allows you to trade directly with the seller, while keeping fees at a minimum,
                requiring no sign-in and being completely transparent in terms refund policy and trade history as described by its smart contract.
                SugarSkins cannot withold your funds and cannot ban your account (in this case your Ethereum address or steam trade link).
                It is simply a tool for facilitating secure exchanges of funds and CS:GO weapons.  </p>

            <h3> Does it work with any other Steam games or types of items?</h3>
            <p> No, the system is currently tailored specifically for trading CS:GO weapons, meaning CS:GO items that have a wear and paint seed property to allow for easy identification once they move from one account to the other.</p>
        </div>
        )
    }
}

export default HelpComponent