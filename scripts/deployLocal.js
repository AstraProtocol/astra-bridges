// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { isValidAddress } = require('../src/utils/ethers');
const hre = require('hardhat');

async function checkAndDeploy(
  address,
  contractName,
  deployedAs,
  deployArgs = []
) {
  const owner = (await hre.ethers.getSigners())[0];
  let contractInstance;
  if (!isValidAddress(address)) {
    // Deploy the contract first
    const Contract = await hre.ethers.getContractFactory(contractName);
    contractInstance = await Contract.deploy(...deployArgs);
    await contractInstance.deployed();

    // Then assign the address
    console.log(
      `✓ ${contractName} deployed for ${deployedAs} at ${contractInstance.address}`
    );
    address = contractInstance.address;
  } else {
    console.log(`✓ Using ${deployedAs} instance at ${address}`);
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
  const chainId = hre.network.config.chainId;
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
  // srcTokenAddr.mint(owner.address, hre.ethers.BigNumber.from("10").pow(20));

  // After that, deploy the mock lzEndpoint
  const { address: lzEndpointAddr, contractInstance: lzEndpoint } =
    await checkAndDeploy(
      process.env.LZ_ENDPOINT,
      'LZEndpointMock',
      'LZEndpointMock',
      [chainId]
    );

  // Then, deploy the bridge contract on src and dst (in the same blockchain)
  const { address: srcBridgeAddr, contractInstance: srcBridge } =
    await checkAndDeploy(process.env.SRC_BRIDGE, 'Bridge', 'SrcBridge', [
      chainId,
      lzEndpointAddr,
    ]);
  const { address: dstBridgeAddr, contractInstance: dstBridge } =
    await checkAndDeploy(process.env.DST_BRIDGE, 'Bridge', 'DstBridge', [
      chainId,
      lzEndpointAddr,
    ]);

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
    `✓ Done register src resource: ${srcHandlerAddr} - ${resourceID} - ${srcTokenAddr}`
  );
  await dstBridge.adminSetResource(dstHandlerAddr, resourceID, dstTokenAddr, {
    gasPrice: 20000000000,
    gasLimit: 20000000000,
  });
  console.log(
    `✓ Done register dst resource: ${dstHandlerAddr} - ${resourceID} - ${dstTokenAddr}`
  );

  // Set burnable for destination bridge
  await dstBridge.adminSetBurnable(dstHandlerAddr, dstTokenAddr, {
    gasPrice: 20000000000,
    gasLimit: 20000000000,
  });
  console.log(
    `✓ Done set burnable handler: ${dstHandlerAddr} - ${dstTokenAddr}`
  );
  // And give the dst handler a role for minting new dst token
  let MINTER_ROLE = await dstToken.MINTER_ROLE();
  await dstToken.grantRole(MINTER_ROLE, dstHandlerAddr, {
    gasPrice: 20000000000,
    gasLimit: 20000000000,
  });

  console.log(
    `✓ Done adding ${dstHandlerAddr} as a minter on contract ${dstTokenAddr}`
  );

  // await tx.wait();

  console.log('✓ Done! All are set.');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
