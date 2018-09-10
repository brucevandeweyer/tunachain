# tunachain

Prototype of fish supply chain solution, combing Arduino Smart Device and Hyperledger Sawtooth (as seen in <a href="https://www.youtube.com/watch?v=8nrVlICgiYM">Hyperledger Sawtooth introduction</a>).

## How does it work?

At Arduino startup a new fish asset is created on Sawtooth blockchain. Arduino tracks state of physical asset (temperature, if tilted or not), sends this to Sawtooth transaction processors, who commit this to the chain. Depending on the state of the asset, its ownership can be transfered using a web interface.

## Content

- /arduino: nodejs layer that manages connection between arduino device and Sawtooth transaction processor
 
- /arduino/sketch: actual arduino code running on device
    
- /client: webinterface that serves as a frontend to read state of onchain assets

- /tp: nodejs code of the Sawtooth transaction processors
