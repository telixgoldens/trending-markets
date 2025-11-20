// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IBinaryMarket {
    function addLiquidity(uint256 yesCollateral, uint256 noCollateral) external;
}

contract LiquidityVault is Ownable {
    IERC20 public collateral;
    uint256 public totalShares;
    mapping(address => uint256) public shares;
    uint256 public poolBalance;

    event Deposited(address indexed user, uint256 amount, uint256 sharesMinted);
    event Withdrawn(address indexed user, uint256 amount, uint256 sharesBurnt);
    event Allocated(address indexed market, uint256 yesAmount, uint256 noAmount);

    constructor(address _collateral, address initialOwner) Ownable(initialOwner) {
       collateral = IERC20(_collateral);
   }

    function deposit(uint256 amount) external {
        require(amount > 0, "Zero");
        require(collateral.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        uint256 minted = amount;
        shares[msg.sender] += minted;
        totalShares += minted;
        poolBalance += amount;
        emit Deposited(msg.sender, amount, minted);
    }

    function withdraw(uint256 shareAmount) external {
        require(shareAmount > 0 && shares[msg.sender] >= shareAmount, "Bad");
        uint256 amount = (poolBalance * shareAmount) / totalShares;
        shares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;
        poolBalance -= amount;
        require(collateral.transfer(msg.sender, amount), "Transfer failed");
        emit Withdrawn(msg.sender, amount, shareAmount);
    }

    function allocateToMarket(address market, uint256 yesAmount, uint256 noAmount) external onlyOwner {
        uint256 total = yesAmount + noAmount;
        require(total <= poolBalance, "Not enough");
        require(collateral.approve(market, total), "approve failed");
        IBinaryMarket(market).addLiquidity(yesAmount, noAmount);
        poolBalance -= total;
        emit Allocated(market, yesAmount, noAmount);
    }
}
