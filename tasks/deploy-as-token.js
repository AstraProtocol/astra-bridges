const chalk = require('chalk');
const { setupArgs } = require('./utils');

/**
 *
 * @param {any} taskArgs Task arguments
 * @param {import('hardhat')} hre Hardhat Runtime Env
 */
module.exports = async function (taskArgs, hre) {
  await setupArgs(taskArgs, hre);
  // First, get the contract and deploy
  const AsERC20 = await hre.ethers.getContractFactory('AsERC20');
  const tokenInstance = await AsERC20.deploy(
    taskArgs.name, // Name of the token
    taskArgs.symbol, // Token Symbol
    taskArgs.decimals // decimals, default to 18
  );

  await tokenInstance.deployed();

  console.log(
    chalk.green('✓'),
    `AsERC20 deployed at ${chalk.blue(tokenInstance.address)}`
  );
};
