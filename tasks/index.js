task(
  'registerResource',
  'Register a resource ID with a contract address for a handler',
  require('./register-resource')
)
  .addParam('bridge', 'Bridge contract address')
  .addParam('handler', 'Handler address')
  .addParam('targetContract', 'Contract address to be registered')
  .addParam('resourceId', 'Resource ID to be registered');

task(
  'setBurnable',
  'Set a token contract as burnable in a handler',
  require('./set-burnable')
)
  .addParam('bridge', 'Bridge contract address')
  .addParam('handler', 'Handler address')
  .addParam('tokenContract', 'Token contract to be registered');

task(
  'setTrustedRemote',
  'Set a bridge contract trusted remote',
  require('./set-trusted-remote')
)
  .addParam('targetChainId', 'Trusted chain id')
  .addParam(
    'targetBridgeAddress',
    'Target chain contract address to be trusted'
  );
