const { task, types } = require('hardhat/config');

task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task(
  'deployAsToken',
  'Deploy a wrapped ERC20 token in destination chain with minter/pauser preset',
  require('./deploy-as-token')
)
  .addParam('name', 'Token name')
  .addParam('symbol', 'Token symbol')
  .addParam('decimals', 'Token decimals, default: 18', 18, types.int);

task(
  'registerResource',
  'Register a resource ID with a contract address for a handler',
  require('./register-resource')
)
  .addParam('bridge', 'Bridge contract address')
  .addParam('handler', 'Handler address')
  .addParam('targetContract', 'Contract address to be registered')
  .addParam('resourceId', 'Resource Id to be registered');

task(
  'setBurnable',
  'Set a token contract as burnable in a handler',
  require('./set-burnable')
)
  .addParam('bridge', 'Bridge contract address')
  .addParam('handler', 'Handler address')
  .addParam('tokenContract', 'Token contract to be set');

task(
  'setTrustedRemote',
  'Set a bridge contract trusted remote',
  require('./set-trusted-remote')
)
  .addParam('bridge', 'Address of deployed bridge')
  .addParam('targetChainId', 'Trusted chain id')
  .addParam(
    'targetBridgeAddress',
    'Target chain contract address to be trusted'
  );

task('approveERC20', 'Approve tokens for transfer', require('./approve-erc20'))
  .addParam(
    'recipient',
    'Destination recipient address',
    process.env.SRC_HANDLER
  )
  .addParam('amount', 'Amount to transfer', 1, types.float)
  .addParam('tokenAddress', 'Token deployed address', process.env.SRC_TOKEN);

task(
  'transferERC20',
  'Transfer tokens cross-chain using bridge',
  require('./transfer-erc20')
)
  .addParam('resourceId', 'resource id', process.env.RESOURCE_ID)
  .addParam('amount', 'Amount to send', 1, types.float)
  .addParam('targetChainId', 'Destination network chain id', 31337, types.int)
  .addParam('recipient', 'Destination recipient address')
  .addParam('bridge', 'Bridge using to send', process.env.SRC_BRIDGE);
