# tunachain
*Prototype of fish supply chain solution - Combining an Arduino Smart Device and Hyperledger Sawtooth blockchain*

## How does it work?

When the Arduino is initialized, a new fish asset is created on the Sawtooth blockchain. After this the Arduino periodically tracks the physical state of the asset (temperature, if tilted or not) and sends this informatio to Sawtooth transaction processors, who commit this to the chain. Depending on the state of the asset, its ownership can be transfered using a web interface.

## Content

- /arduino: nodejs layer that manages connection between arduino device and Sawtooth transaction processor
 
- /arduino/sketch: actual arduino code running on device
    
- /client: webinterface that serves as a frontend to read state of onchain assets

- /tp: nodejs code of the Sawtooth transaction processors
