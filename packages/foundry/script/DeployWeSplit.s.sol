// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import "../contracts/WeSplit.sol";

/**
 * @notice Deploy script for WeSplit contract
 * @dev Inherits ScaffoldETHDeploy which:
 *      - Includes forge-std/Script.sol for deployment
 *      - Includes ScaffoldEthDeployerRunner modifier
 *      - Provides `deployer` variable
 */
contract DeployWeSplit is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        (
            address pythAddress,
            bytes32 fxUsdEurFeed,
            bytes32 ethUsdFeed,
            bytes32 usdcUsdFeed,
            bytes32 btcUsdFeed
        ) = getPythConfig();

        new WeSplit(
            pythAddress,
            fxUsdEurFeed,
            ethUsdFeed,
            usdcUsdFeed,
            btcUsdFeed
        );
    }

    function getPythConfig()
        internal
        view
        returns (
            address pythAddress,
            bytes32 fxUsdEurFeed,
            bytes32 ethUsdFeed,
            bytes32 usdcUsdFeed,
            bytes32 btcUsdFeed
        )
    {
        fxUsdEurFeed = 0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b; // FX.EUR/USD
        ethUsdFeed = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace; // Crypto.ETH/USD
        usdcUsdFeed = 0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a; // Crypto.USDC/USD
        btcUsdFeed = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43; // Crypto.BTC/USD
        if (block.chainid == 10) {
            // Optimism
            pythAddress = address(0xff1a0f4744e8582DF1aE09D5611b887B6a12925C);
        } else if (block.chainid == 8453) {
            // Base
            pythAddress = address(0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a);
        } else if (block.chainid == 31337 || block.chainid == 1337) {
            revert(
                "No Pyth config for local anvil found. Deploy mock or skip."
            );
        } else {
            revert("Unsupported network for deployment");
        }
    }
}
