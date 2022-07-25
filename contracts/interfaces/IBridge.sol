// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.11;

/**
    @title Interface for Bridge contract.
    @author Astra Protocol
 */
interface IBridge {
    /**
     * @dev Emitted when `_amount` tokens are moved from the `_sender` to (`_dstChainId`, `_toAddress`)
     * `_nonce` is the outbound nonce
     */
    event SendToChain(
        address indexed _sender,
        uint16 indexed _dstChainId,
        bytes indexed _toAddress,
        uint256 _amount,
        uint64 _nonce
    );

    /**
     * @dev Emitted when `_amount` tokens are received from `_srcChainId` into the `_toAddress` on the local chain.
     * `_nonce` is the inbound nonce.
     */
    event ReceiveFromChain(
        uint16 indexed _srcChainId,
        bytes indexed _srcAddress,
        address indexed _toAddress,
        uint256 _amount,
        uint64 _nonce
    );

    /**
        @notice Expose chainID that is currently set for the Bridge contract
        @return uint16 The {_chainID} that is currently set for the Bridge contract.
     */
    function chainID() external returns (uint16);
}
