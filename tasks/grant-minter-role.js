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
  if (!isValidAddress(taskArgs.tokenAddress)) {
    return process.exit(1);
  }
  if (!isValidAddress(taskArgs.minter)) {
    return process.exit(1);
  }

  const asToken = await hre.ethers.getContractAt(
    'AsERC20',
    taskArgs.tokenAddress,
    taskArgs.owner
  );
  const MINTER_ROLE = await asToken.MINTER_ROLE();
  const tx = await asToken.grantRole(MINTER_ROLE, taskArgs.minter, {
    gasPrice: taskArgs.gasPrice,
    gasLimit: taskArgs.gasLimit,
  });

  await tx.wait();

  console.log(
    chalk.green('✓'),
    `Done grant minter role:
TxHash:      ${tx.hash}
Token:       ${taskArgs.tokenAddress}
Minter:      ${taskArgs.minter}`
  );
};
