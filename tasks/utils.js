const path = require('path');
const ethers = require('ethers');
const fs = require('fs');

function getDeploymentAddresses(networkName) {
  const PROJECT_ROOT = path.resolve(__dirname, '..');
  const DEPLOYMENT_PATH = path.resolve(PROJECT_ROOT, 'deployments');

  let folderName = networkName;
  if (networkName === 'hardhat') {
    folderName = 'localhost';
  }

  const networkFolderName = fs
    .readdirSync(DEPLOYMENT_PATH)
    .filter((f) => f === folderName)[0];
  if (networkFolderName === undefined) {
    throw new Error('missing deployment files for endpoint ' + folderName);
  }

  let rtnAddresses = {};
  const networkFolderPath = path.resolve(DEPLOYMENT_PATH, folderName);
  const files = fs
    .readdirSync(networkFolderPath)
    .filter((f) => f.includes('.json'));
  files.forEach((file) => {
    const filepath = path.resolve(networkFolderPath, file);
    const data = JSON.parse(fs.readFileSync(filepath));
    const contractName = file.split('.')[0];
    rtnAddresses[contractName] = data.address;
  });

  return rtnAddresses;
}

/**
 *
 * @param {any} args args to setup
 * @param {import('hardhat')} hre hardhat runtime env
 */
const setupArgs = async (args, hre) => {
  args.provider = hre.network.provider;

  args.gasLimit = ethers.utils.hexlify(Number(args.gasLimit));
  args.gasPrice = ethers.utils.hexlify(Number(args.gasPrice));

  args.signers = await hre.ethers.getSigners();
  args.owner = args.signers[0];
};

/**
 * Parse amount of token using decimals
 * @param {number} amount Amount of token
 * @param {number} decimals Token decimal
 * @returns parsed amount
 */
const expandDecimals = (amount, decimals = 18) => {
  return ethers.utils.parseUnits(String(amount), decimals);
};

const isValidAddress = (address) => {
  try {
    ethers.utils.getAddress(address);
  } catch (e) {
    console.log(`"${address}" is not a valid address: ` + e);
    return false;
  }
  return true;
};

module.exports = {
  isValidAddress,
  getDeploymentAddresses,
  setupArgs,
  expandDecimals,
};
