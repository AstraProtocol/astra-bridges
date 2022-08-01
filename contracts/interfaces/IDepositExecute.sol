// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.11;

/**
    @title Interface for handler contracts that support deposits and deposit executions.
    @author ChainSafe Systems.
 */
interface IDepositExecute {
    /**
        @notice It is intended that deposit are made using the Bridge contract.
        @param depositer Address of account making the deposit in the Bridge contract.
        @param data Consists of additional data needed for a specific deposit.
     */
    function deposit(
        bytes32 resourceID,
        address depositer,
        bytes calldata data
    ) external returns (bytes memory);

    /**
        @notice It is executed by the Bridge contract when received payload.
        @param data Consists of additional data needed for a specific deposit execution.
     */
    function execute(bytes32 resourceID, bytes calldata data) external;
}
