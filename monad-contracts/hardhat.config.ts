import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // enables intermediate representation for extra optimization
    },
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.SEPOLIA_PRIVATE_KEY
        ? [process.env.SEPOLIA_PRIVATE_KEY]
        : [],
    },
    bnbTestnet: {
      url: process.env.BNB_RPC_URL || "",
      accounts: [
        process.env.BNB_PRIVATE_KEY!,
        process.env.USER_PRIVATE_KEY!,
        process.env.USER_PRIVATE_KEY2!,
      ].filter(Boolean),
    },
  },
  etherscan: {
    apiKey: {
      bscTestnet: process.env.BSCSCAN_API_KEY || "",
    },
  },
};

export default config;
