// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.11;
pragma experimental ABIEncoderV2;

import "./utils/AccessControl.sol";
import "./utils/SafeCast.sol";
import "./utils/Pausable.sol";
import "./interfaces/IDepositExecute.sol";
import "./interfaces/IBridge.sol";
import "./interfaces/IERCHandler.sol";
import "./interfaces/IGenericHandler.sol";
import "./lzApp/NonblockingLzApp.sol";

/**
    @title Manages by roles and implement NonblockingLzApp
    @author Astra Protocol
 */
contract Bridge is NonblockingLzApp, AccessControl, Pausable, IBridge {
    using SafeCast for *;

    uint16 public _chainID;

    // resourceID => handler address
    mapping(bytes32 => address) public _resourceIDToHandlerAddress;

    modifier onlyAdmin() {
        _onlyAdmin();
        _;
    }

    function _onlyAdmin() private view {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "sender doesn't have admin role");
    }

    /**
        @notice Initializes Bridge, creates and grants {msg.sender} the admin role
        @param chainID_ ID of chain the Bridge contract exists on.
        @param lzEndpoint_ LayerZero endpoint
     */
    constructor(uint16 chainID_, address lzEndpoint_) NonblockingLzApp(lzEndpoint_) {
        _chainID = chainID_;

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function chainID() external view virtual override returns (uint16) {
        return _chainID;
    }

    /**
        @notice Override for estimate send fees for current chain to dst chain
        @param _dstChainId ID of chain to send
        @param _data bytes data to send {resourceID,amount,toAddress}
        @param _useZro use Zro?
        @param _adapterParams additional params
     */
    function estimateSendFee(
        uint16 _dstChainId,
        bytes memory _data,
        bool _useZro,
        bytes memory _adapterParams
    ) public view virtual returns (uint256 nativeFee, uint256 zroFee) {
        return lzEndpoint.estimateFees(_dstChainId, address(this), _data, _useZro, _adapterParams);
    }

    function sendToChain(
        uint16 _dstChainId,
        bytes32 _resourceID,
        bytes calldata _data, // {amount,toAddress}
        bytes calldata _adapterParams
    ) external payable virtual whenNotPaused {
        // First get resource handler ID and verify
        address handlerAddress = _resourceIDToHandlerAddress[_resourceID];
        require(handlerAddress != address(0), "this _resourceID not mapped to any handler");

        // Get handler and deposit into safe
        IDepositExecute depositHandler = IDepositExecute(handlerAddress);
        depositHandler.deposit(_resourceID, msg.sender, _data);

        // Encode payload for sending via LZ
        bytes memory payload = abi.encode(_resourceID, _data);

        _lzSend(_dstChainId, payload, payable(msg.sender), address(0x0), _adapterParams);

        uint64 nonce = lzEndpoint.getOutboundNonce(_dstChainId, address(this));
        emit SendToChain(msg.sender, _dstChainId, payload, nonce);
    }

    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal virtual override {
        // decode and load the resouce ID, and received data
        (bytes32 resourceID, bytes memory data) = abi.decode(_payload, (bytes32, bytes));

        // Get handler by resource ID and execute with data
        address handlerAddress = _resourceIDToHandlerAddress[resourceID];
        IDepositExecute handler = IDepositExecute(handlerAddress);
        handler.execute(resourceID, data);

        emit ReceiveFromChain(_srcChainId, _srcAddress, _payload, _nonce);
    }

    /**
        @notice Removes admin role from {msg.sender} and grants it to {newAdmin}.
        @notice Only callable by an address that currently has the admin role.
        @param newAdmin Address that admin role will be granted to.
     */
    function renounceAdmin(address newAdmin) external onlyAdmin {
        require(msg.sender != newAdmin, "Cannot renounce oneself");
        grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        renounceRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
        @notice Pauses deposits, proposal creation and voting, and deposit executions.
        @notice Only callable by an address that currently has the admin role.
     */
    function adminPauseTransfers() external onlyAdmin {
        _pause(msg.sender);
    }

    /**
        @notice Unpauses deposits, proposal creation and voting, and deposit executions.
        @notice Only callable by an address that currently has the admin role.
     */
    function adminUnpauseTransfers() external onlyAdmin {
        _unpause(msg.sender);
    }

    /**
        @notice Sets a new resource for handler contracts that use the IERCHandler interface,
        and maps the {handlerAddress} to {resourceID} in {_resourceIDToHandlerAddress}.
        @notice Only callable by an address that currently has the admin role.
        @param handlerAddress Address of handler resource will be set for.
        @param resourceID ResourceID to be used when making deposits.
        @param tokenAddress Address of contract to be called when a deposit is made and a deposited is executed.
     */
    function adminSetResource(
        address handlerAddress,
        bytes32 resourceID,
        address tokenAddress
    ) external onlyAdmin {
        _resourceIDToHandlerAddress[resourceID] = handlerAddress;
        IERCHandler handler = IERCHandler(handlerAddress);
        handler.setResource(resourceID, tokenAddress);
    }

    /**
        @notice Sets a new resource for handler contracts that use the IGenericHandler interface,
        and maps the {handlerAddress} to {resourceID} in {_resourceIDToHandlerAddress}.
        @notice Only callable by an address that currently has the admin role.
        @param handlerAddress Address of handler resource will be set for.
        @param resourceID ResourceID to be used when making deposits.
        @param contractAddress Address of contract to be called when a deposit is made and a deposited is executed.
     */
    function adminSetGenericResource(
        address handlerAddress,
        bytes32 resourceID,
        address contractAddress,
        bytes4 depositFunctionSig,
        uint256 depositFunctionDepositerOffset,
        bytes4 executeFunctionSig
    ) external onlyAdmin {
        _resourceIDToHandlerAddress[resourceID] = handlerAddress;
        IGenericHandler handler = IGenericHandler(handlerAddress);
        handler.setResource(
            resourceID,
            contractAddress,
            depositFunctionSig,
            depositFunctionDepositerOffset,
            executeFunctionSig
        );
    }

    /**
        @notice Sets a resource as burnable for handler contracts that use the IERCHandler interface.
        @notice Only callable by an address that currently has the admin role.
        @param handlerAddress Address of handler resource will be set for.
        @param tokenAddress Address of contract to be called when a deposit is made and a deposited is executed.
     */
    function adminSetBurnable(address handlerAddress, address tokenAddress) external onlyAdmin {
        IERCHandler handler = IERCHandler(handlerAddress);
        handler.setBurnable(tokenAddress);
    }

    /**
        @notice Transfers eth in the contract to the specified addresses. The parameters addrs and amounts are mapped 1-1.
        This means that the address at index 0 for addrs will receive the amount (in WEI) from amounts at index 0.
        @param addrs Array of addresses to transfer {amounts} to.
        @param amounts Array of amonuts to transfer to {addrs}.
     */
    function transferFunds(address payable[] calldata addrs, uint256[] calldata amounts) external onlyAdmin {
        for (uint256 i = 0; i < addrs.length; i++) {
            addrs[i].transfer(amounts[i]);
        }
    }
}
