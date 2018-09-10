/* 
Original code was written by Zac Delventhal @delventhalz.
Adapted by Nero Vanbiervliet and Bruce Vandeweyer
 */

'use strict'

const { createHash } = require('crypto')
const { TransactionHandler } = require('sawtooth-sdk/processor')
const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions')
const { TransactionHeader } = require('sawtooth-sdk/protobuf')

// helper function to generate addresses based on sha512 hash function 
const getAddress = (key, length = 64) => {
  return createHash('sha512').update(key).digest('hex').slice(0, length)
}

// helper function to get the address of an asset in the fish namespace
const getAssetAddress = name => PREFIX + getAddress(name, 58)

// gets the address of the main properties
const getMainPropsAddress = (assetName) => {
  return getAssetAddress(assetName) + '00' + '0000' // zeros split for clarity
}

// gets the address if the temp array
const getTempArrayAddress = (assetName, index) => {
  return getAssetAddress(assetName) + '01' + index
}

// function to add leading zero(s) to nextIndex
const padIndex = (index) => {
  let paddedIndex = index+"";
  while (paddedIndex.length < 4)
    paddedIndex = "0" + paddedIndex
  return paddedIndex
}


// transaction family is defined by a name
const FAMILY = 'fish'
// address namespace is 3 bytes, created as first 6 hex characters of hash of family name
const PREFIX = getAddress(FAMILY, 6)

// helper functions to encode and decode binary data
const encode = obj => Buffer.from(JSON.stringify(obj, Object.keys(obj).sort()))
const decode = buf => JSON.parse(buf.toString())

// handler for action 'create'
// add a new asset to the state
const createAsset = (asset, owner, state, sold, catchTime, catchLat, catchLon) => { // owner == signer
  const mainPropsAddress = getMainPropsAddress(asset)

  return state.get([mainPropsAddress])
    .then(entries => {
      // check if an asset already exists on the address
      const entry = entries[mainPropsAddress] // there is only one entry because only one address was queried
      if (entry && entry.length > 0) {
        throw new InvalidTransaction('Asset name in use')
      }

      // new asset is added to the state
      return state.set(
        {[mainPropsAddress]: encode({name: asset, owner, sold:sold, catchTime:catchTime, catchLat:catchLat, catchLon:catchLon, tilted: false, spoiled: false, nextIndex: 1},)})
    })
}

// handler for action 'add-tilted'
const setTilted = (asset, signer, state) => {
  const mainPropsAddress = getMainPropsAddress(asset)
  
  return state.get([mainPropsAddress])
    .then(entries => {
      // check if an asset exists on the address
      const entry = entries[mainPropsAddress] // there is only one entry because only one address was queried
      if (!(entry && entry.length > 0)) {
        throw new InvalidTransaction('Asset not found')
      }

      let processed = decode(entry)

      // assign new values
      processed.tilted = true
      processed.spoiled = true

      // set tilted to true and return the new state
      return state.set({
        [mainPropsAddress]: encode(processed) 
      })
    })
}

// handler for action 'add-temp'
const setTemp = (asset, signer, state, temp, time) => {
  const mainPropsAddress = getMainPropsAddress(asset)
  
  return state.get([mainPropsAddress])
    .then(entries => {
      // check if an asset exists on the address
      const entry = entries[mainPropsAddress] // there is only one entry because only one address was queried
      if (!(entry && entry.length > 0)) {
        throw new InvalidTransaction('Asset not found')
      }

      let processed = decode(entry)

      const tempArrayAddress = getTempArrayAddress(asset, padIndex(processed.nextIndex))

      processed.nextIndex += 1

      // check if temp exceeds spoiled threshold
      if (temp >= 6)
      {
        processed.spoiled = true
        console.log("Spoiled by temp.")
      }
      //new temp is added to state and asset main properties saved
      return state.set(
        {
          [tempArrayAddress]: encode({temp:temp, time:time}),
          [mainPropsAddress]: encode(processed)
        })
  })
}

const transferAsset = (asset, signer, state) => {
  const mainPropsAddress = getMainPropsAddress(asset)

  return state.get([mainPropsAddress])
  .then(entries => {
    // check if an asset exists on the address
    const entry = entries[mainPropsAddress] // there is only one entry because only one address was queried
    if (!(entry && entry.length > 0)) {
      throw new InvalidTransaction('Asset not found')
    }

    let processed = decode(entry)

    //check if spoiled
    if (!processed.spoiled) 
    {
      // change owner and sold staus
      processed.owner = signer
      processed.sold = true
    } else 
    {
      console.log(processed.name + 'is spoiled. No transfer possible.')
    }
    
    // save changes in state
    return state.set({
      [mainPropsAddress]: encode(processed) 
    })
  })
}

class JSONHandler extends TransactionHandler {
  constructor () {
    console.log('Initializing JSON handler for Sawtooth Tuna Chain')
    super(FAMILY, '0.0', 'application/json', [PREFIX]) // 0.0 = version of family
  }

  // this function is called by the transaction processor when new transaction needs to be handled
  apply (txn, state) {
    // parse the transaction header and payload
    const header = TransactionHeader.decode(txn.header)
    const signer = header.signerPubkey
    const { action, asset, owner, sold, catchTime, catchLat, catchLon, temp, time} = JSON.parse(txn.payload)

    // call the appropriate function based on the payload's action
    console.log(`Handling transaction:  ${action} > ${asset}`,
                owner ? `> ${owner.slice(0, 8)}... ` : '',
                `:: ${signer.slice(0, 8)}...`)

    // depending on the type, the correct handler is called
    if (action === 'create') return createAsset(asset, signer, state, sold, catchTime, catchLat, catchLon)
    if (action === 'add-tilted') return setTilted(asset, signer, state)
    if (action === 'add-temp') return setTemp(asset, signer, state, temp, time)
    if (action === 'transfer') return transferAsset(asset, signer, state)
    
    // no handler function was found for the action
    return Promise.resolve().then(() => {
      throw new InvalidTransaction(
        'Action must be "create, add-tilted, add-temp or transfer"' // list to be expanded when more actions are created
      )
    })
  }
}

module.exports = {
  JSONHandler
}
