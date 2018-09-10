/* 
Original code was written by Zac Delventhal @delventhalz.
Adapted by Nero Vanbiervliet and Bruce Vandeweyer
 */


'use strict'

const {
  makeKeyPair,
  getState,
  submitUpdate
} = require('./api_interaction')

//implementing serial connection
const SerialClass = require('serialport')
const ParserClass = require('parser-readline')

const portname = '/dev/ttyACM0'
const serial = new SerialClass(portname, {baudRate: 9600})
const parser = serial.pipe(new ParserClass({delimiter: '\r\n'}))

serial.on('open', onOpen)

parser.on('data', (data) => {
  console.log(data)
  if (data == 'create') app.createAsset()
  if (data[0] == 't') app.setTemp(data.substring(1))
  if (data == 'spoiled') app.setTilted()
  if (data == "sold?") app.checkTransfer()
})

function onOpen() {
	console.log("Connection opened")
}

// application object
const app = { user: null, currentAsset: null, assets: null}

// creates a new fish asset
// first checks the state for the next free name: fish1, fish2, fish3...
app.createAsset = function () {
  let id = 0
  let existingNames = app.assets.map(x => x.name)
  let newName
  while (true) {
    id++
    newName = 'fish'+id
    if (!existingNames.includes(newName)) break;
  }
  console.log(newName + ' submitted to validator')
  this.currentAsset = newName
  let sold = false
  let catchTime = Date.now()
  let catchLat = parseFloat(Math.random()*50)
  let catchLon = parseFloat(Math.random()*20)
  // submit new asset to api
  submitUpdate({action:'create', asset:newName, owner:this.user.public, sold, catchTime, catchLat, catchLon}, this.user.private)
}

// set the state of the current asset to tilted
app.setTilted = function () {
  submitUpdate({action: 'add-tilted', asset:app.currentAsset, owner:app.user.public}, app.user.private)
}

// add temp to array
app.setTemp = function (temp) {
  let time = Date.now()
  submitUpdate({action: 'add-temp', asset:app.currentAsset, owner:app.user.public, temp, time}, app.user.private)
}

// check if sold
app.checkTransfer = function () {
  getState(app.assets).then(function (assets) {
    let nameSoldPairs = assets.map(x => x.name + x.sold)
    if (nameSoldPairs.includes(app.currentAsset+'true')) 
    {
      serial.write("true")
      console.log(app.currentAsset + " sold. Opening lock.")
    }
  })
}

// initialise
app.user = makeKeyPair()
getState(app.assets).then(function (assets) {
  app.assets = assets
})
