'use strict';

const hre = require('hardhat');

const abi = [
  'function upgradeTo(address _implementation) external'
];

async function main() {
  const [ signer ] = await hre.ethers.getSigners();
  const ConnectToken = await hre.ethers.getContractFactory('ConnectToken');
  const connectToken = await hre.upgrades.upgradeProxy('0xEABB8996eA1662cAd2f7fB715127852cd3262Ae9', ConnectToken);
  console.log(connectToken);
}

main().then(() => process.exit(0)).catch((err) => console.error(err));
