require("hardhat-deploy");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy-ethers");

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");

global.GENESIS = 12097104;

const fetch = require("node-fetch");
const fs = require("fs");
const ethers = require("ethers");
const getGasPrice = async () => {
  const { data } = await fetch("https://etherchain.org/api/gasnow").then((d) =>
    d.json()
  );
  return ethers.BigNumber.from(data.rapid.toString());
};
const ALCHEMY_API_KEY =
  process.env.ALCHEMY_API_KEY || "vMrNzYo115X7_5Y9l9y2q0dFWp4HU5u5";
ethers.providers.BaseProvider.prototype.getGasPrice = getGasPrice;

const SECRET = process.env.SECRET;
const unlockWalletIfSet = () => {
  if (process.env.PVTKEY) return `0x${process.env.PVTKEY}`;
  if (SECRET) {
    let privateKey;
    try {
      const wallet = ethers.Wallet.fromEncryptedJsonSync(
        fs.readFileSync(SECRET),
        process.env.PASSWD
      );
      privateKey = wallet._signingKey().privateKey;
      console.log("unlocked " + wallet.address);
      return privateKey;
    } catch (e) {
      return ethers.Wallet.createRandom()._signingKey().privateKey;
    }
  } else {
    return "0x25f1e8d3e5738503d4854ffe994366cb6910ca7aa7220160c2ab519ace5f7c5e";
  }
};

module.exports = {
  solidity: "0.6.12",
  networks: {
    live: {
      url: new ethers.providers.AlchemyProvider(
        "mainnet",
        "opf1pfLThCfvgyUtE9Mj_NvZwY3yIVJx"
      ).connection.url,
      accounts: [unlockWalletIfSet()],
      chainId: 1,
    },
    arbitrum: {
      url: "https://arbitrum-mainnet.infura.io/v3/84b153ad9f404526a98a76a091d6203d",
      chainId: 42161,
      accounts: [unlockWalletIfSet()],
    },
    hardhat: {
      accounts: [
        {
          privateKey: unlockWalletIfSet(),
          balance: ethers.utils.parseEther("15").toString(),
        },
        {
          privateKey: unlockWalletIfSet(),
          balance: ethers.utils.parseEther("15").toString(),
        },
      ],
      forking: {
        url: "https://arb-mainnet.g.alchemy.com/v2/vMrNzYo115X7_5Y9l9y2q0dFWp4HU5u5",
      },
      // forking: {
      //   url: "https://eth-mainnet.alchemyapi.io/v2/opf1pfLThCfvgyUtE9Mj_NvZwY3yIVJx",
      // },
    },
  },
  external: {
    contracts: [
      {
        artifacts: "../connect-token/artifacts",
      },
    ],

    deployments: {
      live: ["../connect-token/deployments"],
    },
  },
};
