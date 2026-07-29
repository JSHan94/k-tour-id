// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "./ForeignerSBT.sol"; // Imports the interface of the SBT contract.

/**
 * @title forKRW Stablecoin
 * @author Project K
 * @dev An ERC20 stablecoin for verified foreigners, identified by their ownership of a ForeignerSBT.
 * Access to minting, transfers, and yield is restricted to SBT holders.
 */
contract forKRW is ERC20, Ownable {
    // The ForeignerSBT contract that this token uses for verification.
    ForeignerSBT public immutable foreignerSbtContract;

    // --- Events ---
    event YieldUpdated(address indexed user, uint256 loyaltyPointsAdded);

    /**
     * @dev The constructor initializes the ERC20 token and links the SBT contract.
     * @param _sbtContractAddress The deployed address of the ForeignerSBT contract.
     */
    constructor(address _sbtContractAddress) ERC20("Foreign KRW", "forKRW") Ownable(msg.sender) {
        require(_sbtContractAddress != address(0), "SBT contract address cannot be zero");
        foreignerSbtContract = ForeignerSBT(_sbtContractAddress);
    }

    /**
     * @notice Mints new forKRW tokens to a specified address.
     * @dev Can only be called by the contract owner. It requires the recipient to be a verified foreigner.
     * @param to The address to mint tokens to.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(foreignerSbtContract.balanceOf(to) > 0, "Recipient is not a verified foreigner");
        _mint(to, amount);
    }

    /**
     * @notice Updates the yield for the caller, minting new tokens as loyalty points.
     * @dev Requires the caller to hold a ForeignerSBT.
     * @param _loyaltyPoints The amount of forKRW to mint as yield.
     */
    function updateYield(uint256 _loyaltyPoints) external {
        require(foreignerSbtContract.balanceOf(_msgSender()) > 0, "User is not a verified foreigner");
        _mint(_msgSender(), _loyaltyPoints);
        emit YieldUpdated(_msgSender(), _loyaltyPoints);
    }

    /**
     * @dev Overrides the internal ERC20 `_update` function to add a verification check on all transfers.
     * This ensures that forKRW tokens can only be held and received by verified foreigners.
     */
    function _update(address from, address to, uint256 value) internal override {
        // When transferring to a new address (not minting or burning), check if the recipient is verified.
        if (to != address(0) && from != address(0)) {
            require(foreignerSbtContract.balanceOf(to) > 0, "Recipient is not a verified foreigner");
        }
        super._update(from, to, value);
    }
}
