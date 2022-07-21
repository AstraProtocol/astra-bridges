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
 * @param {import('hardhat/types').EthereumProvider} provider 
 * @param {string} hash 
 */
const waitForTx = async (provider, hash) => {
  console.log(`Waiting for tx: ${hash}...`);
  while (!(await provider.getTransactionReceipt(hash))) {
    sleep(5000);
  }
};

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
  args.owner = signers[0];
};

module.exports = {
  getDeploymentAddresses,
  waitForTx,
  setupArgs,
};
