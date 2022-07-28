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
    { gasPrice: 2_000_000_000, gasLimit: 2_000_000_000 }
  );

  await tx.wait();
};
