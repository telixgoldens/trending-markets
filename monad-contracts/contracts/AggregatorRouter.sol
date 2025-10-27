// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IPriceableMarket {
    function getReserves() external view returns (uint256 yesReserve, uint256 noReserve);
    function buy(uint8 outcomeIndex, uint256 collateralIn, uint256 minTokensOut) external;
}

contract AggregatorRouter {
    // naive route: choose market with largest opposite reserve to maximize depth
    function routeBuy(address[] calldata markets, uint8 outcomeIndex, uint256 collateralIn, uint256 minTokensOut) external {
        require(markets.length > 0, "No markets");
        uint256 bestIndex = 0;
        uint256 bestDepth = 0;
        for (uint i = 0; i < markets.length; i++) {
            (uint256 yes, uint256 no) = IPriceableMarket(markets[i]).getReserves();
            uint256 depth = (outcomeIndex == 1) ? no : yes;
            if (depth > bestDepth) {
                bestDepth = depth;
                bestIndex = i;
            }
        }
        // forward tokens: user must have approved the chosen market factory / collateral transfers handled in market
        IPriceableMarket(markets[bestIndex]).buy(outcomeIndex, collateralIn, minTokensOut);
    }
}
