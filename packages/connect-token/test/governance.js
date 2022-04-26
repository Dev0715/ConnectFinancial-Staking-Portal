'use strict';

const hre = require('hardhat');

describe('governance', () => {
  let cnfg, governor, signer;
  beforeEach(async () => {
    await hre.deployments.fixture();
    cnfg = await hre.ethers.getContract('CND');
    governor = await hre.ethers.getContract('GovernorAlpha');
    [ signer ] = await hre.ethers.getSigners();
  });
  it('should govern', async () => {
  });
});

