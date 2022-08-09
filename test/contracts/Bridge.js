const { expect } = require('chai');
const { ethers } = require('hardhat');
const { expandDecimals } = require('../../tasks/utils');

describe('Bridge', function () {
  beforeEach(async function () {
    const [owner] = await ethers.getSigners();
    // Source chain
    this.srcChainId = 12;
    this.dstChainId = 23;

    this.walletAddress = owner.address;

    // create a LayerZero Endpoint mock for testing
    const LayerZeroEndpointMock = await ethers.getContractFactory(
      'LZEndpointMock'
    );
    this.srcLZEndpoint = await LayerZeroEndpointMock.deploy(this.srcChainId);
    this.dstLZEndpoint = await LayerZeroEndpointMock.deploy(this.dstChainId);

    // Deploy mock tokens
    const ERC20MockToken = await ethers.getContractFactory('ERC20Mock');
    const DstERC20Mock = await ethers.getContractFactory('DstERC20Mock');
    this.srcToken = await ERC20MockToken.deploy('Mock', 'MOCK');
    this.dstToken = await DstERC20Mock.deploy('Wrapped Mock', 'WMOCK');

    // Mint some mock token into wallet address
    await this.srcToken.mint(
      owner.address,
      ethers.BigNumber.from('10').pow(20)
    );

    // create two Bridge instances
    const Bridge = await ethers.getContractFactory('Bridge');
    this.srcBridge = await Bridge.deploy(
      this.srcChainId,
      this.srcLZEndpoint.address
    );
    this.dstBridge = await Bridge.deploy(
      this.dstChainId,
      this.dstLZEndpoint.address
    );

    const mockEstimatedNativeFee = ethers.BigNumber.from(10);
    const mockEstimatedZroFee = ethers.BigNumber.from(2);
    await this.srcLZEndpoint.setEstimatedFees(
      mockEstimatedNativeFee,
      mockEstimatedZroFee
    );
    await this.dstLZEndpoint.setEstimatedFees(
      mockEstimatedNativeFee,
      mockEstimatedZroFee
    );
    this.srcLZEndpoint.setDestLzEndpoint(
      this.dstBridge.address,
      this.dstLZEndpoint.address
    );
    this.dstLZEndpoint.setDestLzEndpoint(
      this.srcBridge.address,
      this.srcLZEndpoint.address
    );

    // set each contracts source address so it can send to each other
    this.srcBridge.setTrustedRemote(this.dstChainId, this.dstBridge.address);
    this.dstBridge.setTrustedRemote(this.srcChainId, this.srcBridge.address);

    // deploy handler
    const Handler = await ethers.getContractFactory('ERC20Handler');
    this.srcHandler = await Handler.deploy(this.srcBridge.address);
    this.dstHandler = await Handler.deploy(this.dstBridge.address);

    // Set resource for bridges
    this.resourceID =
      '0x000000000000000000000000000000c76ebe4a02bbc34786d860b355f5a5ce00';
    await this.srcBridge.adminSetResource(
      this.srcHandler.address,
      this.resourceID,
      this.srcToken.address
    );

    await this.dstBridge.adminSetResource(
      this.dstHandler.address,
      this.resourceID,
      this.dstToken.address
    );
    await this.dstBridge.adminSetBurnable(
      this.dstHandler.address,
      this.dstToken.address
    );

    // And give the dst handler a role for minting new dst token
    let MINTER_ROLE = await this.dstToken.MINTER_ROLE();
    await this.dstToken.grantRole(MINTER_ROLE, this.dstHandler.address);
  });

  it('send from src to dst via Bridge and vice versa', async function () {
    expect(
      (await this.dstToken.balanceOf(this.walletAddress)).toString()
    ).to.be.eq('0');
    const sendAmount = expandDecimals(1);
    // Send Mock token from chain src to chain dst
    // 1st, approve for handler to move token
    await this.srcToken.approve(this.srcHandler.address, sendAmount.mul(10));
    // Then send token
    const data =
      process.env.RESOURCE_ID + // Resource ID           (32 bytes)
      ethers.utils.hexZeroPad(sendAmount.toHexString(), 32).substring(2) + // Deposit Amount        (32 bytes)
      this.walletAddress.substring(2) +
      '000000000000000000000000'; // RecipientAddress + 0 pads      (32 bytes)

    const adapterParams = ethers.utils.solidityPack(
      ['uint16', 'uint256'],
      [1, 350000]
    );
    await this.srcBridge.sendToChain(
      this.walletAddress,
      this.dstChainId,
      this.resourceID,
      data,
      adapterParams,
      { value: 20_000_000_000 }
    );

    // After that, verify minted mock token
    let balance = await this.dstToken.balanceOf(this.walletAddress);
    expect(balance.toString()).to.be.eq(sendAmount.toString());

    // Send one more
    await this.srcBridge.sendToChain(
      this.walletAddress,
      this.dstChainId,
      this.resourceID,
      data,
      adapterParams,
      { value: 20_000_000_000 }
    );

    // Expect receive from dst
    await this.dstToken.approve(this.dstHandler.address, sendAmount.mul(10));
    await this.dstBridge.sendToChain(
      this.walletAddress,
      this.srcChainId,
      this.resourceID,
      process.env.RESOURCE_ID + // Resource ID           (32 bytes)
        ethers.utils.hexZeroPad(sendAmount.toHexString(), 32).substring(2) + // Deposit Amount        (32 bytes)
        this.walletAddress.substring(2) +
        '000000000000000000000000', // RecipientAddress      (32 bytes),
      adapterParams,
      { value: 20_000_000_000 }
    );

    const dstBalance = await this.dstToken.balanceOf(this.walletAddress);
    expect(dstBalance.toString()).to.be.eq(sendAmount.toString());

    const srcBalance = await this.srcToken.balanceOf(this.walletAddress);
    expect(srcBalance.toString().startsWith("99")).to.be.true;
  });
});
