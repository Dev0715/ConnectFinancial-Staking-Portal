'use strict';

const hre = require('hardhat');
const { ethers } = hre;
const { parseEther } = ethers.utils;

async function main() {
  const sc = await hre.ethers.getContract('StakingController');
  await sc.govern(
    60 * 60 * 24 * 30 * 6,
    60 * 60 * 24,
    parseEther('5000'),
    parseEther('0'),
    0,
    parseEther('2'),
    [
      parseEther('1.15'),
      parseEther('1.25'),
      parseEther('1.3'),
      parseEther('1.4'),
    ],
    [2, 4, 6, 8],
    [
      parseEther('5000'),
      parseEther('20000'),
      parseEther('100000'),
      parseEther('200000'),
    ]
  );
  console.error(tx.hash);
  const receipt = await tx.wait();
  console.log(JSON.stringify(receipt, null, 2));
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
