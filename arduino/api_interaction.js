/* 
Original code was written by Zac Delventhal @delventhalz.
Adapted by Nero Vanbiervliet and Bruce Vandeweyer
 */
 
'use strict'

const http = require('http')
const request = require('request');
const { createHash } = require('crypto')
const {
  signer,
  BatchEncoder,
  TransactionEncoder
} = require('sawtooth-sdk/client')

// arduino will connect to api of the first node
const API_URL = 'localhost'
const API_PORT = 8080

// helper function to generate addresses based on sha512 hash function 
const getAddress = (key, length = 64) => {
  return createHash('sha512').update(key).digest('hex').slice(0, length)
}

const FAMILY = 'fish'
const PREFIX = getAddress(FAMILY, 6)

// create new key-pair
const makeKeyPair = () => {
  const privateKey = signer.makePrivateKey()
  return {
    public: signer.getPublicKey(privateKey),
    private: privateKey
  }
}

// fetch current state
const getState = function() {
  return new Promise(function(resolve, reject) {
    http.get(`http://${API_URL}:${API_PORT}/state?address=${PREFIX}`, (res) => {
      res.on('data', function (body) {
        let data = JSON.parse(body).data
        data = data.map(d => Buffer.from(d.data, 'base64'))
        data = data.map(d => JSON.parse(d))
        resolve(data)
      });
    })
  })
}

// submit signed transaction to validator
const submitUpdate = (payload, privateKey) => {
  // create data
  const transaction = new TransactionEncoder(privateKey, {
    inputs: [PREFIX],
    outputs: [PREFIX],
    familyName: FAMILY,
    familyVersion: '0.0',
    payloadEncoding: 'application/json',
    payloadEncoder: p => Buffer.from(JSON.stringify(p))
  }).create(payload)
  const batchBytes = new BatchEncoder(privateKey).createEncoded(transaction)
  console.log(payload);
  
  request.post({
      url: `http://${API_URL}:${API_PORT}/batches?wait`,
      headers: {'Content-Type': 'application/octet-stream'},
      body: batchBytes
    },
    function (error, response, body) {
        console.log(body)
    }
  );
}

module.exports = {
  makeKeyPair,
  getState,
  submitUpdate
}
