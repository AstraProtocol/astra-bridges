const chalk = require('chalk');
const { isValidAddress } = require('../src/utils/ethers');
const { setupArgs } = require('./utils');

/**
 *
 * @param {any} taskArgs Task arguments
 * @param {import('hardhat')} hre Hardhat Runtime Env
 */
module.exports = async function (taskArgs, hre) {
  await setupArgs(taskArgs, hre);

  if (!isValidAddress(taskArgs.bridge)) {
    return process.exit(1);
  }

  const srcBridge = await hre.ethers.getContractAt(
    'Bridge',
    taskArgs.bridge,
    taskArgs.owner
  );
  const { ethers } = hre;

  const data =
    process.env.RESOURCE_ID + // Resource ID           (32 bytes)
    ethers.utils
      .hexZeroPad(
        ethers.utils.parseEther(String(taskArgs.amount)).toHexString(),
        32
      )
      .substring(2) + // Deposit Amount        (32 bytes)
    taskArgs.recipient.substring(2) +
    '000000000000000000000000'; // RecipientAddress      (32 bytes)

  const adapterParams = ethers.utils.solidityPack(
    ['uint16', 'uint256'],
    [1, 350000]
  );

  // Call send to chain
  const tx = await srcBridge.sendToChain(
    taskArgs.owner.address,
    taskArgs.targetChainId,
    taskArgs.resourceId,
    data,
    adapterParams,
    {
      value: 20_000_000_000,
      gasPrice: 20_000_000_000,
      gasLimit: 20_000_000_000,
    }
  );

  await tx.wait();

  console.log(
    chalk.green('✓'),
    `Done transfer:
Recipient:    ${taskArgs.recipient}
Resource ID:  ${taskArgs.resourceId}
Target Chain: ${taskArgs.targetChainId}
Amount:       ${taskArgs.amount}`
  );
};
