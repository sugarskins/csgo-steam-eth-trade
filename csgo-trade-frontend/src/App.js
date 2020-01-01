import React from 'react'
import logo from './logo.svg'
import './App.css'
import ItemsListComponent from './ItemsListComponent'
import HelpComponent from './HelpComponent'
import url from 'url'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import {
  HashRouter as Router,
  Switch,
  Route
} from 'react-router-dom'

function App() {
  return (
    <div className="App">
      <header>
        
      </header>
      <div className="App-body">
        <Router>
        <div>
          {/* A <Switch> looks through its children <Route>s and
              renders the first one that matches the current URL. */}
          <Switch>
            <Route path="/help">
              <Help />
            </Route>
            <Route path="/" component={ItemsListComponent}>     
            </Route>
          </Switch>
        </div>
      </Router>
      </div>
      {footer()}
    </div>
  );
}

function footer() {
  return (
    <Navbar expand="lg" bg="dark"  text="white" className='App-footer d-flex justify-content-center' >
      <Nav.Link > Sugarskins 2019. Powered by Steam. Not affiliated with Valve Corp. </Nav.Link>
    </Navbar>
  )

}

function Help() {
  return <HelpComponent></HelpComponent>
}


export default App;
