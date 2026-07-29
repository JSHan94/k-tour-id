// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {ForeignerSBT} from "../src/ForeignerSBT.sol";

contract ForeignerSBTTest is Test {
    ForeignerSBT public foreignerSBT;
    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        foreignerSBT = new ForeignerSBT();
    }

    function test_Deployment() public {
        assertEq(foreignerSBT.name(), "Foreigner Verification SBT");
        assertEq(foreignerSBT.symbol(), "FORV");
        assertEq(foreignerSBT.owner(), owner);
    }

    function test_MintSBT() public {
        // Test successful minting
        foreignerSBT.mintSBT(user1);
        
        assertEq(foreignerSBT.balanceOf(user1), 1);
        assertEq(foreignerSBT.ownerOf(0), user1);
    }

    function test_MintSBT_RevertOnZeroAddress() public {
        vm.expectRevert("Cannot mint to the zero address");
        foreignerSBT.mintSBT(address(0));
    }

    function test_MintSBT_RevertOnDuplicate() public {
        foreignerSBT.mintSBT(user1);
        
        vm.expectRevert("User already has a verification SBT");
        foreignerSBT.mintSBT(user1);
    }

    function test_BurnSBT() public {
        foreignerSBT.mintSBT(user1);
        uint256 tokenId = 0;
        
        foreignerSBT.burnSBT(tokenId);
        
        assertEq(foreignerSBT.balanceOf(user1), 0);
    }

    function test_TransferRevert() public {
        foreignerSBT.mintSBT(user1);
        uint256 tokenId = 0;
        
        vm.prank(user1);
        vm.expectRevert("SBTs are non-transferable");
        foreignerSBT.transferFrom(user1, user2, tokenId);
    }

    function test_OnlyOwnerCanMint() public {
        vm.prank(user1);
        vm.expectRevert();
        foreignerSBT.mintSBT(user2);
    }

    function test_OnlyOwnerCanBurn() public {
        foreignerSBT.mintSBT(user1);
        
        vm.prank(user1);
        vm.expectRevert();
        foreignerSBT.burnSBT(0);
    }
}
