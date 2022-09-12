const chalk = require('chalk');
const { isValidAddress } = require('../tasks/utils');
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

  const rawData =
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

  // padding resourceID for estimate send fee
  let sendFeeResp = await srcBridge.estimateSendFee(
    taskArgs.targetChainId,
    taskArgs.resourceId + rawData,
    true,
    adapterParams
  );
  const sendFee = sendFeeResp.nativeFee.add(sendFeeResp.zroFee);

  // Call send to chain
  const tx = await srcBridge.sendToChain(
    taskArgs.targetChainId,
    taskArgs.resourceId,
    '0x' + rawData,
    "0x0000000000000000000000000000000000000000",
    adapterParams,
    {
      value: sendFee,
      gasPrice: taskArgs.gasPrice,
      gasLimit: taskArgs.gasLimit,
    }
  );

  await tx.wait();

  console.log(
    chalk.green('✓'),
    `Done transfer:
TxHash:       ${tx.hash}
Recipient:    ${taskArgs.recipient}
Resource ID:  ${taskArgs.resourceId}
Target Chain: ${taskArgs.targetChainId}
Amount:       ${taskArgs.amount}`
  );
};
