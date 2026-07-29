// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {ForeignerSBT} from "../src/ForeignerSBT.sol";
import {forKRW} from "../src/forKRW.sol";

contract forKRWTest is Test {
    ForeignerSBT public foreignerSBT;
    forKRW public stablecoin;
    address public owner;
    address public user1;
    address public user2;
    address public unverifiedUser;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        unverifiedUser = address(0x3);
        
        // Deploy SBT contract first
        foreignerSBT = new ForeignerSBT();
        
        // Deploy stablecoin with SBT contract address
        stablecoin = new forKRW(address(foreignerSBT));
        
        // Mint SBTs to verified users
        foreignerSBT.mintSBT(user1);
        foreignerSBT.mintSBT(user2);
    }

    function test_Deployment() public {
        assertEq(stablecoin.name(), "Foreign KRW");
        assertEq(stablecoin.symbol(), "forKRW");
        assertEq(stablecoin.owner(), owner);
        assertEq(address(stablecoin.foreignerSbtContract()), address(foreignerSBT));
    }

    function test_Mint() public {
        uint256 amount = 1000 * 10**18;
        
        stablecoin.mint(user1, amount);
        
        assertEq(stablecoin.balanceOf(user1), amount);
    }

    function test_Mint_RevertOnUnverifiedUser() public {
        uint256 amount = 1000 * 10**18;
        
        vm.expectRevert("Recipient is not a verified foreigner");
        stablecoin.mint(unverifiedUser, amount);
    }

    function test_UpdateYield() public {
        uint256 loyaltyPoints = 100 * 10**18;
        
        vm.prank(user1);
        stablecoin.updateYield(loyaltyPoints);
        
        assertEq(stablecoin.balanceOf(user1), loyaltyPoints);
    }

    function test_UpdateYield_RevertOnUnverifiedUser() public {
        uint256 loyaltyPoints = 100 * 10**18;
        
        vm.prank(unverifiedUser);
        vm.expectRevert("User is not a verified foreigner");
        stablecoin.updateYield(loyaltyPoints);
    }

    function test_Transfer() public {
        uint256 amount = 1000 * 10**18;
        uint256 transferAmount = 500 * 10**18;
        
        // Mint tokens to user1
        stablecoin.mint(user1, amount);
        
        // Transfer from user1 to user2 (both verified)
        vm.prank(user1);
        stablecoin.transfer(user2, transferAmount);
        
        assertEq(stablecoin.balanceOf(user1), amount - transferAmount);
        assertEq(stablecoin.balanceOf(user2), transferAmount);
    }

    function test_Transfer_RevertOnUnverifiedRecipient() public {
        uint256 amount = 1000 * 10**18;
        uint256 transferAmount = 500 * 10**18;
        
        // Mint tokens to user1
        stablecoin.mint(user1, amount);
        
        // Try to transfer to unverified user
        vm.prank(user1);
        vm.expectRevert("Recipient is not a verified foreigner");
        stablecoin.transfer(unverifiedUser, transferAmount);
    }

    function test_OnlyOwnerCanMint() public {
        uint256 amount = 1000 * 10**18;
        
        vm.prank(user1);
        vm.expectRevert();
        stablecoin.mint(user2, amount);
    }

    function test_YieldEvent() public {
        uint256 loyaltyPoints = 100 * 10**18;
        
        vm.expectEmit(true, false, false, true);
        emit forKRW.YieldUpdated(user1, loyaltyPoints);
        
        vm.prank(user1);
        stablecoin.updateYield(loyaltyPoints);
    }
}
