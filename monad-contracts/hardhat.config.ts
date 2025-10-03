import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.SEPOLIA_PRIVATE_KEY
        ? [process.env.SEPOLIA_PRIVATE_KEY]
        : [],
    },
    monad: {
      url: process.env.MONAD_RPC_URL || "",
      accounts: [
        process.env.MONAD_PRIVATE_KEY!,
        process.env.USER_PRIVATE_KEY!,
        process.env.USER_PRIVATE_KEY2!,
      ].filter(Boolean),
    },
  },
};

export default config;
