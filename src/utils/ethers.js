const ethers = require('ethers');

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
};
