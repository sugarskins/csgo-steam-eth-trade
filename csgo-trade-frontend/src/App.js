import React from 'react'
import logo from './logo.svg'
import './App.css'
import ItemsListComponent from './ItemsListComponent'
import url from 'url'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import {
  BrowserRouter as Router,
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
    <Navbar expand="lg" bg="dark"  text="white" className='App-footer' >
      <Nav.Link > Sugarskins 2019 </Nav.Link>
      <Nav.Link href="https://github.com/sugarskins" > <img height="32" width="32" src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg" />  </Nav.Link>
      <Nav.Link href="/help">Help </Nav.Link>
    </Navbar>
  )

}

function Help() {
  return <h2>Help</h2>;
}


export default App;
