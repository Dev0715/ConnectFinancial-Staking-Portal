"use strict";

require("hardhat-deploy");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-deploy-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
const fetch = require("node-fetch");
const fs = require("fs");
const ethers = require("ethers");
async function getGasPrice() {
  const { data } = await fetch("https://etherchain.org/api/gasnow").then((d) =>
    d.json()
  );
  return ethers.BigNumber.from(data.rapid.toString());
}

ethers.providers.BaseProvider.prototype.getGasPrice = getGasPrice;

const SECRET = process.env.SECRET;
const GREP = process.env.GREP;
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;
const ALCHEMY_API_KEY =
  process.env.ALCHEMY_API_KEY || "vMrNzYo115X7_5Y9l9y2q0dFWp4HU5u5";
const unlockWalletIfSet = () => {
  if (process.env.PRIV_KEY) return `0x${process.env.PRIV_KEY}`;
  if (SECRET) {
    let privateKey;
    try {
      const wallet = ethers.Wallet.fromEncryptedJsonSync(
        fs.readFileSync(SECRET),
        process.env.PASSWD
      );
      privateKey = wallet._signingKey().privateKey;
      console.log("unlocked " + wallet.address);
      console.log(privateKey);
      return privateKey;
    } catch (e) {
      return ethers.Wallet.createRandom()._signingKey().privateKey;
    }
  } else {
    return "0x25f1e8d3e5738503d4854ffe994366cb6910ca7aa7220160c2ab519ace5f7c5e";
  }
};

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.5.16",
      },
      {
        version: "0.6.8",
      },
      {
        version: "0.6.12",
      },
    ],
  },
  networks: {
    live: {
      url: new ethers.providers.InfuraProvider("mainnet", INFURA_PROJECT_ID)
        .connection.url,
      accounts: [unlockWalletIfSet()],
      chainId: 1,
    },
    ropsten: {
      url: new ethers.providers.AlchemyProvider("ropsten", ALCHEMY_API_KEY)
        .connection.url,
      accounts: [unlockWalletIfSet()],
      chainId: 3,
    },
    rinkeby: {
      url: new ethers.providers.InfuraProvider("rinkeby", INFURA_PROJECT_ID)
        .connection.url,
      accounts: [unlockWalletIfSet()],
      chainId: 4,
    },
    arbitrum: {
      url: new ethers.providers.AlchemyProvider("arbitrum", ALCHEMY_API_KEY)
        .connection.url,
      chainId: 42161,
      accounts: [unlockWalletIfSet()],
    },
    test: {
      url: new ethers.providers.AlchemyProvider(
        "arbitrum-rinkeby",
        ALCHEMY_API_KEY
      ).connection.url,
      accounts: [unlockWalletIfSet()],
      chainId: 421611,
    },
    hardhat: {
      forking: {
        url:
          "https://arb-mainnet.g.alchemy.com/v2/" +
          (ALCHEMY_API_KEY || "opf1pfLThCfvgyUtE9Mj_NvZwY3yIVJx"),
      },
      accounts: [
        {
          privateKey: unlockWalletIfSet(),
          balance: ethers.utils.parseEther("10").toString(),
        },
      ],
    },
    local: {
      url: "http://localhost:8545",
      chainId: 1337,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  mocha: {
    grep: GREP,
    timeout: 0,
  },
  gasReporter: {
    enabled: true,
  },
};
