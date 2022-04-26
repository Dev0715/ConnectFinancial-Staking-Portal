'use strict';

const hre = require('hardhat');

async () => {
  return true;
  const { upgrades, ethers, deployments } = hre;
  const [signer] = await ethers.getSigners();
  const connectToken = await deployments.get('ConnectToken');
};

module.exports = {
  skip: async () => true,
};
