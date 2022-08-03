# Astra Bridges

This project uses Solidity smart contracts to enable transfers to and from EVM compatible chains. These contracts consist of a core bridge contract (Bridge.sol) and a set of handler contracts.

A list of command can be found via CLI:

```shell
npx hardhat
```

## Getting Started

To initialize project, run install and copy `.env` file:

```shell
yarn install
cp .env.example .env
```

Then modify the `.env` file with your appropriate variables.

Run tests with following CLI:

```shell
npx hardhat test
```

## Deploy smart contracts

### Localhost Hardhat

To deploy a test with Hardhat localhost, first run the node:

```shell
npx hardhat node
```

Then, in another shell, run a script for deploying:

```shell
npx hardhat run --network localhost scripts/deployLocal.js
```

Then we can continue with other tasks: `approveERC20`, `transferERC20`

### Testnets

Run deploy Bridge and ERC20Handler for an available public testnet:

```shell
npx hardhat run --network fuji scripts/deploy.js
```

## Run Tasks

There are some pre-defined tasks that can run directly for setting up Astra Bridge and interacting with smart contracts:

### Approve Transfer

```shell
npx hardhat approveERC20 --network [network] --amount [amount] --recipient [approving-address] --tokenAddress [approving-token]
```

For example, following script will allow SRC_HANDLER to send 10 amount of SRC_TOKEN:

```shell
npx hardhat approveERC20 --amount 10 --network localhost
```

### Transfer via Bridge `sendToChain`

```shell
npx hardhat transferERC20 --network [network] --amount [amount] --target-chain-id [target] --recipient [receiving-address] --resource-id [resource-id] --bridge [bridge-address]
```

For example:

```shell
npx hardhat transferERC20 --amount 1 --recipient 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --network localhost --target-chain-id 31338
```

### Setting up Bridge

```shell
npx hardhat grantMinterRole --network [network]
```

```shell
npx hardhat registerResource --network [network]
```

```shell
npx hardhat setTrustedRemote --network [network]
```

```shell
npx hardhat setBurnable --network [network]
```

### Admin withdraw funds

```shell
npx hardhat withdrawFunds --amount <amount> --recipient <address> --bridge $SRC_BRIDGE --handler $SRC_HANDLER --token-address $SRC_TOKEN --gas-price <gasPrice> --gas-limit <gasLimit> --network bsc-testnet
```

## Folder Structures

TODO: Update document for folder structures
