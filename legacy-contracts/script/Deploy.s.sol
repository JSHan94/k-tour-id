// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ForeignerSBT} from "../src/ForeignerSBT.sol";
import {forKRW} from "../src/forKRW.sol";

contract DeployScript is Script {
    ForeignerSBT public foreignerSBT;
    forKRW public stablecoin;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy ForeignerSBT contract first
        foreignerSBT = new ForeignerSBT();
        console.log("ForeignerSBT deployed at:", address(foreignerSBT));

        // Deploy forKRW stablecoin with SBT contract address
        stablecoin = new forKRW(address(foreignerSBT));
        console.log("forKRW stablecoin deployed at:", address(stablecoin));

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("ForeignerSBT Address:", address(foreignerSBT));
        console.log("forKRW Address:", address(stablecoin));
        console.log("Deployer Address:", vm.addr(deployerPrivateKey));
        console.log("==========================\n");
    }
}
