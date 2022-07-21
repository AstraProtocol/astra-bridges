const { waitForTx, setupArgs } = require('./utils');

/**
 *
 * @param {any} taskArgs Task arguments
 * @param {import('hardhat')} hre Hardhat Runtime Env
 */
module.exports = async function (taskArgs, hre) {
  setupArgs(taskArgs, hre);
  const srcContractName = 'Bridge';

  const bridgeInstance = await hre.ethers.getContractAt(srcContractName);
  const tx = await bridgeInstance.adminSetBurnable(
    taskArgs.handler,
    taskArgs.tokenContract,
    { gasPrice: taskArgs.gasPrice, gasLimit: taskArgs.gasLimit }
  );

  await waitForTx(args.provider, tx.hash);
};
