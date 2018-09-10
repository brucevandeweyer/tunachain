/* 
Original code was written by Zac Delventhal @delventhalz.
Adapted by Nero Vanbiervliet and Bruce Vandeweyer
 */

'use strict'

const { TransactionProcessor } = require('sawtooth-sdk/processor')
const { JSONHandler } = require('./handlers')

// transaction processor will initiate connection to the validator
const DEFAULT_VALIDATOR_URL = 'tcp://localhost:4004'
let validatorUrl;

// validator url can be submitted as command line argument
// if not, set default value
if (process.argv.length < 3) {
  console.log('No validator url passed as argument, defaulting to: ' + DEFAULT_VALIDATOR_URL)
  validatorUrl = DEFAULT_VALIDATOR_URL
}
else {
  validatorUrl = process.argv[2]
}

// initialize transaction processor
const tp = new TransactionProcessor(validatorUrl)
// add custom handler
tp.addHandler(new JSONHandler())
tp.start()
