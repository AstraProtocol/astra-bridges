const chalk = require('chalk');
const { setupArgs } = require('./utils');

/**
 *
 * @param {any} taskArgs Task arguments
 * @param {import('hardhat')} hre Hardhat Runtime Env
 */
module.exports = async function (taskArgs, hre) {
  await setupArgs(taskArgs, hre);

  const bridgeInstance = await hre.ethers.getContractAt(
    'Bridge',
    taskArgs.bridge,
    taskArgs.owner
  );
  const tx = await bridgeInstance.adminSetBurnable(
    taskArgs.handler,
    taskArgs.tokenContract,
    { gasPrice: taskArgs.gasPrice, gasLimit: taskArgs.gasLimit }
  );

  await tx.wait();

  console.log(
    chalk.green('✓'),
    `Done set burnable for token:
TxHash:   ${tx.hash}
Bridge:   ${taskArgs.bridge}
Handler:  ${taskArgs.handler}
Token:    ${taskArgs.tokenContract}`
  );
};
