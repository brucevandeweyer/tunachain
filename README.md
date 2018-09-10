# tunachain

Prototype of fish supply chain solution, combing Arduino Smart Device and Hyperledger Sawtooth (as seen in <a href="https://www.youtube.com/watch?v=8nrVlICgiYM">Hyperledger Sawtooth introduction</a>).

## How does it work?

At startup of Arduino new fish asset is created. Arduino logs state of physical asset (temperature, if tilted or not) and logs this periodically to Sawtooth blockchain. Depending on this state, asset can be transfered using a web interface.

## Content

- /arduino: nodejs layer that manages connection between arduino device and Sawtooth transaction processor
 
- /arduino/sketch: actual arduino code running on device
    
- /client: webinterface that serves as a frontend to read state of onchain assets

- /tp: nodejs code of the Sawtooth transaction processors
