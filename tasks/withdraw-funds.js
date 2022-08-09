const chalk = require('chalk');
const { isValidAddress } = require('../tasks/utils');
const { setupArgs } = require('./utils');

/**
 *
 * @param {any} taskArgs Task arguments
 * @param {import('hardhat')} hre Hardhat Runtime Env
 */
module.exports = async function (taskArgs, hre) {
  const { ethers } = hre;
  await setupArgs(taskArgs, hre);
  if (!isValidAddress(taskArgs.bridge)) {
    return process.exit(1);
  }
  if (!isValidAddress(taskArgs.tokenAddress)) {
    return process.exit(1);
  }
  if (!taskArgs.recipient) {
    taskArgs.recipient = taskArgs.owner.address;
  }

  const bridge = await hre.ethers.getContractAt(
    'Bridge',
    taskArgs.bridge,
    taskArgs.owner
  );
  // Encode (tokenAddress, recipient, amount)
  const data =
    '0x' +
    '000000000000000000000000' +
    taskArgs.tokenAddress.substring(2) +
    '000000000000000000000000' +
    taskArgs.recipient.substring(2) +
    ethers.utils
      .hexZeroPad(
        ethers.utils.parseEther(String(taskArgs.amount)).toHexString(),
        32
      )
      .substring(2); // Deposit Amount        (32 bytes)
  const tx = await bridge.adminWithdraw(taskArgs.handler, data, {
    gasPrice: taskArgs.gasPrice,
    gasLimit: taskArgs.gasLimit,
  });

  await tx.wait();

  console.log(
    chalk.green('✓'),
    `Done admin withdraw funds:
TxHash:      ${tx.hash}
Token:       ${taskArgs.tokenAddress}
Amount:      ${taskArgs.amount}
Recipient:   ${taskArgs.recipient}`
  );
};
