// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20Minimal {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IPriceableMarket {
    function getReserves() external view returns (uint256 yesReserve, uint256 noReserve);
    function buy(uint8 outcomeIndex, uint256 collateralIn, uint256 minTokensOut) external;
    function resolved() external view returns (bool);
    function collateral() external view returns (address);
}

contract AggregatorRouter {
    // naive route: choose market with largest opposite reserve to maximize depth
    function routeBuy(address[] calldata markets, uint8 outcomeIndex, uint256 collateralIn, uint256 minTokensOut) external {
        require(markets.length > 0, "No markets");
        uint256 bestIndex = 0;
        uint256 bestDepth = 0;
         bool found = false;
        for (uint i = 0; i < markets.length; i++) {
            if (IPriceableMarket(markets[i]).resolved()) continue;
            (uint256 yes, uint256 no) = IPriceableMarket(markets[i]).getReserves();
            uint256 depth = (outcomeIndex == 1) ? no : yes;
            if (depth > bestDepth) {
                bestDepth = depth;
                bestIndex = i;
                found = true;
            }
        }
        require(found, "No open markets");

        address chosen = markets[bestIndex];

        // pull user's collateral into the chosen market (caller must have approved this router)
        address collAddr = IPriceableMarket(chosen).collateral();
        require(collAddr != address(0), "No collateral");
        bool ok = IERC20Minimal(collAddr).transferFrom(msg.sender, chosen, collateralIn);
        require(ok, "transferFrom failed");

        // now call the market's buy — market will detect tokens already in contract and skip pulling again
        IPriceableMarket(chosen).buy(outcomeIndex, collateralIn, minTokensOut);
    }
}
