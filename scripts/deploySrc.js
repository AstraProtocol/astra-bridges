// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { isValidAddress } = require('../utils/ethers');
const hre = require('hardhat');

async function main() {
  const srcERC20Token = process.env.SRC_TOKEN;
  if (!isValidAddress(srcERC20Token)) {
    throw new Error('SRC_TOKEN must be a valid address');
  }

  // First, deploy the bridge contract on src
  const Bridge = await hre.ethers.getContractFactory('Bridge');
  const bridge = await Bridge.deploy(
    hre.network.config.chainId, // Network
    lzEndpoint // lzEndpoint address
  );

  await bridge.deployed();
  console.log(`✓ Bridge contract deployed at ${bridge.address}`);

  // Then deploy a ERC20Handler on src
  const ERC20Handler = await hre.ethers.getContractFactory('ERC20Handler');
  const erc20Handler = await ERC20Handler.deploy(
    bridge.address // Bridge address
  );
  await erc20Handler.deployed();
  console.log(`✓ ERC20Handler contract deployed at ${erc20Handler.address}`);

  // Then configuration the resource
  console.log(`! Please config the resource with following commands:
\$ npx hardhat registerResource --bridge <address> --handler <address> --targetContract <address> --resourceId <address>
`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
