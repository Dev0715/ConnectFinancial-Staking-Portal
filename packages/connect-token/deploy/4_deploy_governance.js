"use strict";

const hre = require("hardhat");
const { ethers } = hre;
const { parseEther, formatEther } = ethers.utils;
const deploy = require("../lib/deploy-helpers");
const { deployments } = hre;
const { PROXY_ADMIN } = deploy;

async function deployGovernance() {
  return true;
  const signer = await deploy.getSigner();
  const [realSigner] = await ethers.getSigners();
  const from = await realSigner.getAddress();
  const deployer = await realSigner.getAddress();
  const timelock = await deployments.deploy("Timelock", {
    contractName: "Timelock",
    libraries: {},
    args: [from, 60 * 60 * 24 * 7],
    from: deployer,
  });
  const cnd = await deployments.deploy("CND", {
    contractName: "CND",
    args: [from],
    libraries: {},
    from: deployer,
  });
  const governor = await deployments.deploy("GovernorAlpha", {
    contractName: "GovernorAlpha",
    args: [timelock.address, cnd.address, from],
    libraries: {},
    from: deployer,
  });
}

module.exports = {
  skip: () => true,
};
