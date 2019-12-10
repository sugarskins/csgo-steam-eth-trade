import React from 'react'
import logo from './logo.svg'
import './App.css'
import ItemsListComponent from './ItemsListComponent'
import url from 'url'
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
    </div>
  );
}

function Help() {
  return <h2>Help</h2>;
}

function Users() {
  return <h2>Users</h2>;
}

export default App;
