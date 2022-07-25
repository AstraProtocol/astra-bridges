const { setupArgs } = require('./utils');

/**
 *
 * @param {any} taskArgs Task arguments
 * @param {import('hardhat')} hre Hardhat Runtime Env
 */
module.exports = async function (taskArgs, hre) {
  setupArgs(taskArgs, hre);
  const srcContractName = 'Bridge';

  const bridgeInstance = await hre.ethers.getContractAt(srcContractName);
  const tx = await bridgeInstance.setTrustedRemote(
    taskArgs.targetChainId,
    taskArgs.targetBridgeAddress
  );

  await tx.wait();
};
