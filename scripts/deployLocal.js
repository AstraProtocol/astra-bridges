// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { isValidAddress } = require('../src/utils/ethers');
const hre = require('hardhat');
const fs = require('fs/promises');
const path = require('path');
const chalk = require('chalk');

async function checkAndDeploy(
  address,
  contractName,
  deployedAs,
  deployArgs = []
) {
  const owner = (await hre.ethers.getSigners())[0];
  let contractInstance;
  console.log(`=> Start deploying ${deployedAs}...`);
  if (!isValidAddress(address)) {
    // Deploy the contract first
    const Contract = await hre.ethers.getContractFactory(contractName);
    contractInstance = await Contract.deploy(...deployArgs);
    await contractInstance.deployed();

    // Then assign the address
    console.log(
      chalk.green('✓'),
      ` ${contractName} deployed for ${deployedAs} at ${chalk.blue(
        contractInstance.address
      )}`
    );
    address = contractInstance.address;
  } else {
    console.log(
      chalk.green('✓'),
      `Using ${deployedAs} instance at ${chalk.yellow(address)}`
    );
    contractInstance = await hre.ethers.getContractAt(
      contractName,
      address,
      owner
    );
  }
  return {
    address,
    contractInstance,
  };
}

async function main() {
  const envFilepath = path.resolve(__dirname, '..', '.env');

  const srcChainId = hre.network.config.chainId || 31337;
  const dstChainId = srcChainId + 1;
  // First, required a test ERC20 token or mocked
  const { contractInstance: srcToken, address: srcTokenAddr } =
    await checkAndDeploy(process.env.SRC_TOKEN, 'ERC20Mock', 'ERC20Mock', [
      'Mock',
      'MOCK',
    ]);
  const { contractInstance: dstToken, address: dstTokenAddr } =
    await checkAndDeploy(
      process.env.DST_TOKEN,
      'DstERC20Mock',
      'Wrapped ERC20Mock',
      ['WrappedMock', 'WMOCK']
    );
  // And mint some mock token into current account 100 token
  const owner = (await hre.ethers.getSigners())[0];
  await srcToken.mint(owner.address, hre.ethers.BigNumber.from('10').pow(20));

  // After that, deploy the mock lzEndpoint for src, dst
  const { address: srcLZEndpointAddr, contractInstance: srcLZEndpoint } =
    await checkAndDeploy(
      process.env.SRC_LZ_ENDPOINT,
      'LZEndpointMock',
      'Src LZEndpointMock',
      [srcChainId]
    );
  const { address: dstLZEndpointAddr, contractInstance: dstLZEndpoint } =
    await checkAndDeploy(
      process.env.DST_LZ_ENDPOINT,
      'LZEndpointMock',
      'Dst LZEndpointMock',
      [dstChainId]
    );

  const mockEstimatedNativeFee = hre.ethers.BigNumber.from(10);
  const mockEstimatedZroFee = hre.ethers.BigNumber.from(2);
  await srcLZEndpoint.setEstimatedFees(
    mockEstimatedNativeFee,
    mockEstimatedZroFee
  );
  await dstLZEndpoint.setEstimatedFees(
    mockEstimatedNativeFee,
    mockEstimatedZroFee
  );

  // Then, deploy the bridge contract on src and dst (in the same blockchain)
  const { address: srcBridgeAddr, contractInstance: srcBridge } =
    await checkAndDeploy(process.env.SRC_BRIDGE, 'Bridge', 'SrcBridge', [
      srcChainId,
      srcLZEndpointAddr,
    ]);
  const { address: dstBridgeAddr, contractInstance: dstBridge } =
    await checkAndDeploy(process.env.DST_BRIDGE, 'Bridge', 'DstBridge', [
      dstChainId,
      dstLZEndpointAddr,
    ]);

  // And config lzEndpoint for trusting each other
  await srcLZEndpoint.setDestLzEndpoint(dstBridgeAddr, dstLZEndpoint.address);
  await dstLZEndpoint.setDestLzEndpoint(srcBridgeAddr, srcLZEndpoint.address);
  // And set trusted remote for each other
  await srcBridge.setTrustedRemote(dstChainId, dstBridgeAddr);
  await dstBridge.setTrustedRemote(srcChainId, srcBridgeAddr);

  // Deploy handlers
  const { address: srcHandlerAddr, contractInstance: srcHandler } =
    await checkAndDeploy(
      process.env.SRC_HANDLER,
      'ERC20Handler',
      'SrcHandler',
      [srcBridgeAddr]
    );
  const { address: dstHandlerAddr, contractInstance: dstHandler } =
    await checkAndDeploy(
      process.env.DST_HANDLER,
      'ERC20Handler',
      'DstHandler',
      [dstBridgeAddr]
    );

  // Set resources for bridges
  const resourceID =
    process.env.RESOURCE_ID ||
    '0x000000000000000000000000000000c76ebe4a02bbc34786d860b355f5a5ce00';
  await srcBridge.adminSetResource(srcHandlerAddr, resourceID, srcTokenAddr, {
    gasPrice: 20000000000,
    gasLimit: 20000000000,
  });
  console.log(
    chalk.green('✓'),
    `Done register src resource: ${srcHandlerAddr} - ${resourceID} - ${srcTokenAddr}`
  );
  await dstBridge.adminSetResource(dstHandlerAddr, resourceID, dstTokenAddr, {
    gasPrice: 20000000000,
    gasLimit: 20000000000,
  });
  console.log(
    chalk.green('✓'),
    `Done register dst resource: ${dstHandlerAddr} - ${resourceID} - ${dstTokenAddr}`
  );

  // Set burnable for destination bridge
  await dstBridge.adminSetBurnable(dstHandlerAddr, dstTokenAddr, {
    gasPrice: 20000000000,
    gasLimit: 20000000000,
  });
  console.log(
    chalk.green('✓'),
    `Done set burnable handler: ${dstHandlerAddr} - ${dstTokenAddr}`
  );
  // And give the dst handler a role for minting new dst token
  let MINTER_ROLE = await dstToken.MINTER_ROLE();
  await dstToken.grantRole(MINTER_ROLE, dstHandlerAddr, {
    gasPrice: 20000000000,
    gasLimit: 20000000000,
  });

  console.log(
    chalk.green('✓'),
    `Done adding ${dstHandlerAddr} as a minter on contract ${dstTokenAddr}`
  );

  // await tx.wait();

  console.log(chalk.green('✓'), 'Done! All are set.');

  // Write to env file
  await fs.writeFile(
    envFilepath,
    `SRC_TOKEN=${srcTokenAddr}
DST_TOKEN=${dstTokenAddr}
SRC_LZ_ENDPOINT=${srcLZEndpointAddr}
DST_LZ_ENDPOINT=${dstLZEndpointAddr}
SRC_BRIDGE=${srcBridgeAddr}
DST_BRIDGE=${dstBridgeAddr}
RESOURCE_ID=0x000000000000000000000000000000c76ebe4a02bbc34786d860b355f5a5ce00
SRC_HANDLER=${srcHandlerAddr}
DST_HANDLER=${dstHandlerAddr}
`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
