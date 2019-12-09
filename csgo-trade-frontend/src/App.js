import React from 'react'
import logo from './logo.svg'
import './App.css'
import ItemsListComponent from './ItemsListComponent'
import url from 'url'

function parseUrlRoot(rawUrl) {
  const parsed = url.parse(rawUrl)
  return `${parsed.protocol}//${parsed.host}`
}




function App() {
  return (
    <div className="App">
      <header>
        
      </header>
      <body className="App-body">
        <ItemsListComponent url={parseUrlRoot(window.location.href)} ></ItemsListComponent>
        </body>
      <a href="https://icons8.com/icon/13650/steam">Steam icon by Icons8</a>
    </div>
  );
}

export default App;
