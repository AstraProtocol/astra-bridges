const hre = require('hardhat');
const chalk = require('chalk');
const endpoints = require('../constants/layerzeroEndpoints.json');

async function main() {
  const chainId = hre.network.config.chainId || 31337; // Fallback to localhost
  const lzEndpointAddr = endpoints[hre.network.name];
  if (!lzEndpointAddr) {
    throw new Error('No LZ endpoint for this network');
  }

  // First, deploy the bridge contract on dst
  const Bridge = await hre.ethers.getContractFactory('Bridge');
  const bridgeInstance = await Bridge.deploy(
    chainId, // Network
    lzEndpointAddr // lzEndpoint address
  );

  await bridgeInstance.deployed();
  console.log(
    chalk.green('✓'),
    `Bridge contract deployed at ${chalk.blue(bridgeInstance.address)}`
  );

  // Then deploy a ERC20Handler on this network
  const ERC20Handler = await hre.ethers.getContractFactory('ERC20Handler');
  const erc20Handler = await ERC20Handler.deploy(
    bridgeInstance.address // Bridge address
  );
  await erc20Handler.deployed();
  console.log(
    chalk.green('✓'),
    `ERC20Handler contract deployed at ${chalk.blue(erc20Handler.address)}`
  );

  // After done deploying, show suggestions
  console.log(
    chalk.red('!'),
    `Please config the resource with following commands:
${chalk.gray(
    `$ npx hardhat registerResource --bridge ${bridgeInstance.address} --handler ${erc20Handler.address} --target-contract <address> --resource-id <resourceID>`
  )}
${chalk.gray(
    `$ npx hardhat setBurnable --bridge ${bridgeInstance.address} --handler ${erc20Handler.address} --token-contract <address>`
  )}
`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
