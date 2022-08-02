const chalk = require('chalk');
const { isValidAddress } = require('../src/utils/ethers');
const { setupArgs, expandDecimals } = require('./utils');

/**
 *
 * @param {any} taskArgs Task arguments
 * @param {import('hardhat')} hre Hardhat Runtime Env
 */
module.exports = async function (taskArgs, hre) {
  await setupArgs(taskArgs, hre);
  if (!isValidAddress(taskArgs.tokenAddress)) {
    return process.exit(1);
  }

  const srcToken = await hre.ethers.getContractAt(
    'ERC20Mock',
    taskArgs.tokenAddress,
    taskArgs.owner
  );
  const tx = await srcToken.approve(
    taskArgs.recipient,
    expandDecimals(taskArgs.amount),
    { gasPrice: taskArgs.gasPrice, gasLimit: taskArgs.gasLimit }
  );

  await tx.wait();

  console.log(
    chalk.green('✓'),
    `Done approval:
TxHash:      ${tx.hash}
Recipient:   ${taskArgs.recipient}
Token:       ${taskArgs.tokenAddress}
Amount:      ${taskArgs.amount}`
  );
};
