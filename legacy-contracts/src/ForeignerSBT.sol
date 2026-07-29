// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ForeignerSBT
 * @author Project K
 * @dev A non-transferable NFT (Soulbound Token) issued to verified non-residents.
 * It serves as a permanent, on-chain proof of verification.
 * The contract owner (an automated verifier service) is the only one who can mint or burn these tokens.
 */
contract ForeignerSBT is ERC721, Ownable {
    uint256 private _nextTokenId;

    /**
     * @dev Sets the name and symbol for the SBT collection. The owner is set to the deployer.
     */
    constructor() ERC721("Foreigner Verification SBT", "FORV") Ownable(msg.sender) {}

    /**
     * @notice Mints a new SBT to a verified user's address.
     * @dev This is the primary function for the verifier service to call.
     * It ensures a user can only ever hold one SBT.
     * @param _verifiedUser The address of the user who passed off-chain verification.
     */
    function mintSBT(address _verifiedUser) external onlyOwner {
        require(_verifiedUser != address(0), "Cannot mint to the zero address");
        require(balanceOf(_verifiedUser) == 0, "User already has a verification SBT");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(_verifiedUser, tokenId);
    }

    /**
     * @notice Allows the owner to revoke (burn) an SBT if a user's status changes.
     * @param tokenId The ID of the SBT to be burned.
     */
    function burnSBT(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
    }

    /**
     * @dev This internal hook is overridden to enforce the non-transferable nature of the SBTs.
     * It ensures tokens can only be created ("transferred" from address 0) or burned 
     * ("transferred" to address 0), but not transferred between regular user accounts.
     */
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        require(from == address(0) || to == address(0), "SBTs are non-transferable");
    }
}
