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
  const tx = await bridgeInstance.setTrustedRemote(
    taskArgs.targetChainId,
    taskArgs.targetBridgeAddress
  );

  await tx.wait();

  console.log(
    chalk.green('✓'),
    `Done register resource:
Source Bridge:  ${taskArgs.bridge}
Target Chain:   ${taskArgs.targetChainId}
Target Bridge:  ${taskArgs.targetBridgeAddress}`
  );
};
