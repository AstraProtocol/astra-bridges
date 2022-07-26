// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.11;
pragma experimental ABIEncoderV2;

import "../interfaces/IDepositExecute.sol";
import "./HandlerHelpers.sol";
import "../safes/ERC20Safe.sol";

/**
    @title Handles ERC20 deposits and deposit executions.
    @author ChainSafe Systems.
    @notice This contract is intended to be used with the Bridge contract.
 */
contract ERC20Handler is IDepositExecute, HandlerHelpers, ERC20Safe {
    /**
        @param bridgeAddress Contract address of previously deployed Bridge.
     */
    constructor(address bridgeAddress) HandlerHelpers(bridgeAddress) {}

    /**
        @notice A deposit is initiatied by making a deposit in the Bridge contract.
        @param resourceID ResourceID used to find address of token to be used for deposit.
        @param depositer Address of account making the deposit in the Bridge contract.
        @param data Consists of {amount} padded to 32 bytes.
        @notice Data passed into the function should be constructed as follows:
        amount                      uint256     bytes   0 - 32
        @dev Depending if the corresponding {tokenAddress} for the parsed {resourceID} is
        marked true in {_burnList}, deposited tokens will be burned, if not, they will be locked.
        @return an empty data.
     */
    function deposit(
        bytes32 resourceID,
        address depositer,
        bytes calldata data
    ) external override onlyBridge returns (bytes memory) {
        uint256 amount = abi.decode(data, (uint256));

        address tokenAddress = _resourceIDToTokenContractAddress[resourceID];
        require(_contractWhitelist[tokenAddress], "provided tokenAddress is not whitelisted");

        if (_burnList[tokenAddress]) {
            burnERC20(tokenAddress, depositer, amount);
        } else {
            lockERC20(tokenAddress, depositer, address(this), amount);
        }
    }

    /**
        @notice Proposal execution should be initiated when a proposal is finalized in the Bridge contract.
        by a relayer on the deposit's destination chain.
        @param data Consists of {resourceID}, {amount}, {toAddress},
        and {destinationRecipientAddress} all padded to 32 bytes.
        @notice Data passed into the function should be constructed as follows:
        amount                                 uint256     bytes  0 - 32
        toAddress                              bytes       bytes  32 - END
     */
    function execute(bytes32 resourceID, bytes calldata data) external override onlyBridge {
        address tokenAddress = _resourceIDToTokenContractAddress[resourceID];
        (uint256 amount, address recipientAddress) = abi.decode(data, (uint256, address));

        require(_contractWhitelist[tokenAddress], "provided tokenAddress is not whitelisted");

        if (_burnList[tokenAddress]) {
            mintERC20(tokenAddress, recipientAddress, amount);
        } else {
            releaseERC20(tokenAddress, recipientAddress, amount);
        }
    }
}
