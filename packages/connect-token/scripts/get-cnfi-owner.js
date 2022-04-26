'use strict';

const hre = require('hardhat');
const { ethers } = hre;

async function main() {
  const [ signer ] = await hre.ethers.getSigners();
  const cnfi = await ethers.getContract('ConnectToken');
  console.log(await cnfi.owner());
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
