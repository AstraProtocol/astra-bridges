require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');

// Register tasks
require('./tasks');

function getMnemonic(networkName) {
  if (networkName) {
    const mnemonic = process.env['MNEMONIC_' + networkName.toUpperCase()];
    if (mnemonic && mnemonic !== '') {
      return mnemonic;
    }
  }

  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic || mnemonic === '') {
    return 'test test test test test test test test test test test junk';
  }

  return mnemonic;
}

function getAccounts(chainKey) {
  return { mnemonic: getMnemonic(chainKey) };
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.11',

  networks: {
    hardhat: {
      blockGasLimit: 100000000000,
    },
    localastra: {
      url: 'http://localhost:8545',
      chainId: 11110,
      accounts: getAccounts(),
    },
    'astra-testnet': {
      url: 'https://rpc.astranaut.dev',
      chainId: 11115,
      accounts: getAccounts(),
    },
    rinkeby: {
      url: 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // public infura endpoint
      chainId: 4,
      accounts: getAccounts(),
    },
    'bsc-testnet': {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      chainId: 97,
      accounts: getAccounts(),
    },
    fuji: {
      url: `https://api.avax-test.network/ext/bc/C/rpc`,
      chainId: 43113,
      accounts: getAccounts(),
    },
  },
};
