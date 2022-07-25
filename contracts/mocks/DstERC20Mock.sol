pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

// this is a MOCK for destination Token
contract DstERC20Mock is ERC20PresetMinterPauser {
    constructor(string memory name_, string memory symbol_) ERC20PresetMinterPauser(name_, symbol_) {}
}
